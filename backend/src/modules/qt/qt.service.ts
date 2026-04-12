import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { QuoteVersion } from './entities/quote-version.entity';
import { QuoteApproval } from './entities/quote-approval.entity';
import { QuoteStatus, quoteStateMachine } from '../../common/statemachine/definitions/quote.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { quoteStatusChanged, quoteApprovalCreated, quoteSent } from '../../common/events/quote-events';
import { CreateQuoteDto, UpdateQuoteDto, QuoteItemInput } from './dto/quote.dto';

@Injectable()
export class QtService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteVersion)
    private versionRepository: Repository<QuoteVersion>,
    @InjectRepository(QuoteApproval)
    private approvalRepository: Repository<QuoteApproval>,
    private readonly eventBus: EventBusService,
  ) {}

  async findQuotes(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { status?: string; customerId?: string; opportunityId?: string; validUntilLte?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Quote[]; total: number }> {
    const qb = this.quoteRepository
      .createQueryBuilder('q')
      .where('q.orgId = :orgId', { orgId })
      .andWhere('q.deletedAt IS NULL');

    if (dataScope === 'self') {
      qb.andWhere('q.createdBy = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('q.status = :status', { status: filters.status });
    }

    if (filters.customerId) {
      qb.andWhere('q.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.opportunityId) {
      qb.andWhere('q.opportunityId = :opportunityId', { opportunityId: filters.opportunityId });
    }

    if (filters.validUntilLte) {
      qb.andWhere('q.validUntil <= :validUntilLte', { validUntilLte: filters.validUntilLte });
    }

    qb.orderBy('q.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findQuoteById(id: string, orgId: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });

    if (!quote) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return quote;
  }

  async findQuoteDetail(id: string, orgId: string): Promise<{ quote: Quote; versions: QuoteVersion[]; approvals: QuoteApproval[] }> {
    const quote = await this.findQuoteById(id, orgId);
    const versions = await this.versionRepository.find({
      where: { quoteId: id, orgId },
      order: { versionNo: 'DESC' },
    });
    const approvals = await this.approvalRepository.find({
      where: { quoteId: id, orgId },
      order: { createdAt: 'DESC' },
    });
    return { quote, versions, approvals };
  }

  async createQuote(
    orgId: string,
    dto: CreateQuoteDto,
    userId: string,
  ): Promise<Quote> {
    const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);

    const quoteNo = await this.generateQuoteNo(orgId);

    const quote = this.quoteRepository.create({
      orgId,
      opportunityId: dto.opportunityId,
      customerId: dto.customerId,
      quoteNo,
      currency: dto.currency || 'CNY',
      amount: totalAmount,
      status: 'draft' as QuoteStatus,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      createdBy: userId,
    });

    const saved = await this.quoteRepository.save(quote);

    const payload = {
      items: dto.items.map(item => ({
        itemType: item.itemType,
        refId: item.refId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
    };

    const version = this.versionRepository.create({
      orgId,
      quoteId: saved.id,
      versionNo: 1,
      payload,
      totalAmount,
      createdBy: userId,
    });

    await this.versionRepository.save(version);

    return saved;
  }

  async updateQuote(
    id: string,
    orgId: string,
    dto: UpdateQuoteDto,
    userId: string,
  ): Promise<Quote> {
    const quote = await this.findQuoteById(id, orgId);

    if (quote.status !== 'draft') {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    if (quote.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.validUntil !== undefined) {
      updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    }
    if (dto.note !== undefined) {
      updateData.note = dto.note;
    }

    if (dto.items && dto.items.length > 0) {
      const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);
      updateData.amount = totalAmount;
      updateData.currentVersionNo = () => 'current_version_no + 1';

      const newVersionNo = quote.currentVersionNo + 1;
      const payload = {
        items: dto.items.map(item => ({
          itemType: item.itemType,
          refId: item.refId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        note: dto.note,
      };

      const version = this.versionRepository.create({
        orgId,
        quoteId: id,
        versionNo: newVersionNo,
        payload,
        totalAmount,
        createdBy: userId,
      });

      await this.versionRepository.save(version);
    }

    await this.quoteRepository.update(id, {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    return this.findQuoteById(id, orgId);
  }

  async submitApproval(
    id: string,
    orgId: string,
    approverIds: string[],
    comment: string | undefined,
    version: number,
    userId: string,
  ): Promise<Quote> {
    const quote = await this.findQuoteById(id, orgId);

    if (quote.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = quote.status;
    quoteStateMachine.validateTransition(quote.status, 'pending_approval' as QuoteStatus);

    for (const approverId of approverIds) {
      const approval = this.approvalRepository.create({
        orgId,
        quoteId: id,
        status: 'pending',
        approverUserId: approverId,
        comment: null,
        createdBy: userId,
      });
      await this.approvalRepository.save(approval);
    }

    await this.quoteRepository.update(id, {
      status: 'pending_approval',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      quoteApprovalCreated({
        orgId,
        quoteId: id,
        approverIds,
        actorType: 'user',
        actorId: userId,
      }),
    );

    this.eventBus.publish(
      quoteStatusChanged({
        orgId,
        quoteId: id,
        fromStatus,
        toStatus: 'pending_approval',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findQuoteById(id, orgId);
  }

  async approveQuote(
    id: string,
    orgId: string,
    action: 'approved' | 'rejected',
    comment: string | undefined,
    userId: string,
  ): Promise<Quote> {
    const quote = await this.findQuoteById(id, orgId);

    if (quote.status !== 'pending_approval') {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    const fromStatus = quote.status;
    const toStatus = action === 'approved' ? 'approved' : 'rejected';
    quoteStateMachine.validateTransition(quote.status, toStatus as QuoteStatus);

    const pendingApproval = await this.approvalRepository.findOne({
      where: { quoteId: id, orgId, status: 'pending', approverUserId: userId },
    });

    if (!pendingApproval) {
      throw new ForbiddenException('AUTH_FORBIDDEN');
    }

    await this.approvalRepository.update(pendingApproval.id, {
      status: action,
      comment: comment || null,
    });

    await this.quoteRepository.update(id, {
      status: toStatus,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      quoteStatusChanged({
        orgId,
        quoteId: id,
        fromStatus,
        toStatus,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findQuoteById(id, orgId);
  }

  async sendQuote(
    id: string,
    orgId: string,
    channel: string,
    receiver: string,
    message: string | undefined,
    version: number,
    userId: string,
  ): Promise<Quote> {
    const quote = await this.findQuoteById(id, orgId);

    if (quote.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = quote.status;
    quoteStateMachine.validateTransition(quote.status, 'sent' as QuoteStatus);

    await this.quoteRepository.update(id, {
      status: 'sent',
      sentAt: new Date(),
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      quoteSent({
        orgId,
        quoteId: id,
        channel,
        receiver,
        actorType: 'user',
        actorId: userId,
      }),
    );

    this.eventBus.publish(
      quoteStatusChanged({
        orgId,
        quoteId: id,
        fromStatus,
        toStatus: 'sent',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findQuoteById(id, orgId);
  }

  async deleteQuote(id: string, orgId: string, userId: string): Promise<void> {
    const quote = await this.findQuoteById(id, orgId);

    if (!['draft', 'rejected'].includes(quote.status)) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.quoteRepository.update(id, {
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }

  private async generateQuoteNo(orgId: string): Promise<string> {
    const count = await this.quoteRepository.count({ where: { orgId } });
    const seq = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `QT-${year}-${seq}`;
  }
}
