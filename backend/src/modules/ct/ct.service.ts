import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { ContractApproval } from './entities/contract-approval.entity';
import { ContractDocument } from './entities/contract-document.entity';
import { ContractStatus, contractStateMachine } from '../../common/statemachine/definitions/contract.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { contractStatusChanged, contractApprovalCreated, contractSigned } from '../../common/events/contract-events';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';

@Injectable()
export class CtService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ContractApproval)
    private approvalRepository: Repository<ContractApproval>,
    @InjectRepository(ContractDocument)
    private documentRepository: Repository<ContractDocument>,
    private readonly eventBus: EventBusService,
  ) {}

  async findContracts(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { status?: string; customerId?: string; opportunityId?: string; startsOnGte?: string; endsOnLte?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Contract[]; total: number }> {
    const qb = this.contractRepository
      .createQueryBuilder('c')
      .where('c.orgId = :orgId', { orgId })
      .andWhere('c.deletedAt IS NULL');

    if (dataScope === 'self') {
      qb.andWhere('c.createdBy = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('c.status = :status', { status: filters.status });
    }

    if (filters.customerId) {
      qb.andWhere('c.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.opportunityId) {
      qb.andWhere('c.opportunityId = :opportunityId', { opportunityId: filters.opportunityId });
    }

    if (filters.startsOnGte) {
      qb.andWhere('c.startsOn >= :startsOnGte', { startsOnGte: filters.startsOnGte });
    }

    if (filters.endsOnLte) {
      qb.andWhere('c.endsOn <= :endsOnLte', { endsOnLte: filters.endsOnLte });
    }

    qb.orderBy('c.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findContractById(id: string, orgId: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });

    if (!contract) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return contract;
  }

  async findContractDetail(id: string, orgId: string): Promise<{ contract: Contract; approvals: ContractApproval[]; documents: ContractDocument[] }> {
    const contract = await this.findContractById(id, orgId);
    const approvals = await this.approvalRepository.find({
      where: { contractId: id, orgId },
      order: { createdAt: 'DESC' },
    });
    const documents = await this.documentRepository.find({
      where: { contractId: id, orgId, deletedAt: null as unknown as undefined },
      order: { createdAt: 'DESC' },
    });
    return { contract, approvals, documents };
  }

  async createContract(
    orgId: string,
    dto: CreateContractDto,
    userId: string,
  ): Promise<Contract> {
    const contractNo = await this.generateContractNo(orgId);

    const contract = this.contractRepository.create({
      orgId,
      quoteId: dto.quoteId || null,
      opportunityId: dto.opportunityId,
      customerId: dto.customerId,
      contractNo,
      status: 'draft' as ContractStatus,
      startsOn: dto.startsOn ? new Date(dto.startsOn) : null,
      endsOn: dto.endsOn ? new Date(dto.endsOn) : null,
      createdBy: userId,
    });

    return this.contractRepository.save(contract);
  }

  async createContractFromQuote(
    orgId: string,
    quoteId: string,
    opportunityId: string,
    customerId: string,
    userId: string,
  ): Promise<Contract> {
    return this.createContract(orgId, {
      quoteId,
      opportunityId,
      customerId,
    }, userId);
  }

  async updateContract(
    id: string,
    orgId: string,
    dto: UpdateContractDto,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.findContractById(id, orgId);

    if (contract.status !== 'draft') {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    if (contract.version !== dto.version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.startsOn !== undefined) {
      updateData.startsOn = dto.startsOn ? new Date(dto.startsOn) : null;
    }
    if (dto.endsOn !== undefined) {
      updateData.endsOn = dto.endsOn ? new Date(dto.endsOn) : null;
    }

    await this.contractRepository.update(id, {
      ...updateData,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    return this.findContractById(id, orgId);
  }

  async submitApproval(
    id: string,
    orgId: string,
    approverIds: string[],
    comment: string | undefined,
    version: number,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.findContractById(id, orgId);

    if (contract.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = contract.status;
    contractStateMachine.validateTransition(contract.status, 'pending_approval' as ContractStatus);

    for (const approverId of approverIds) {
      const approval = this.approvalRepository.create({
        orgId,
        contractId: id,
        status: 'pending',
        approverUserId: approverId,
        comment: null,
        createdBy: userId,
      });
      await this.approvalRepository.save(approval);
    }

    await this.contractRepository.update(id, {
      status: 'pending_approval',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      contractApprovalCreated({
        orgId,
        contractId: id,
        approverIds,
        actorType: 'user',
        actorId: userId,
      }),
    );

    this.eventBus.publish(
      contractStatusChanged({
        orgId,
        contractId: id,
        fromStatus,
        toStatus: 'pending_approval',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findContractById(id, orgId);
  }

  async approveContract(
    id: string,
    orgId: string,
    action: 'approved' | 'rejected',
    comment: string | undefined,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.findContractById(id, orgId);

    if (contract.status !== 'pending_approval') {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    const fromStatus = contract.status;
    const toStatus = action === 'approved' ? 'approved' : 'rejected';
    contractStateMachine.validateTransition(contract.status, toStatus as ContractStatus);

    const pendingApproval = await this.approvalRepository.findOne({
      where: { contractId: id, orgId, status: 'pending', approverUserId: userId },
    });

    if (!pendingApproval) {
      throw new ForbiddenException('AUTH_FORBIDDEN');
    }

    await this.approvalRepository.update(pendingApproval.id, {
      status: action,
      comment: comment || null,
    });

    await this.contractRepository.update(id, {
      status: toStatus as ContractStatus,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      contractStatusChanged({
        orgId,
        contractId: id,
        fromStatus,
        toStatus,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findContractById(id, orgId);
  }

  async signContract(
    id: string,
    orgId: string,
    signProvider: string,
    version: number,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.findContractById(id, orgId);

    if (contract.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    const fromStatus = contract.status;
    contractStateMachine.validateTransition(contract.status, 'signing' as ContractStatus);

    await this.contractRepository.update(id, {
      status: 'signing',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      contractSigned({
        orgId,
        contractId: id,
        signProvider,
        actorType: 'user',
        actorId: userId,
      }),
    );

    this.eventBus.publish(
      contractStatusChanged({
        orgId,
        contractId: id,
        fromStatus,
        toStatus: 'signing',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findContractById(id, orgId);
  }

  async activateContract(
    id: string,
    orgId: string,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.findContractById(id, orgId);

    const fromStatus = contract.status;
    contractStateMachine.validateTransition(contract.status, 'active' as ContractStatus);

    await this.contractRepository.update(id, {
      status: 'active',
      signedAt: new Date(),
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      contractStatusChanged({
        orgId,
        contractId: id,
        fromStatus,
        toStatus: 'active',
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findContractById(id, orgId);
  }

  async terminateContract(
    id: string,
    orgId: string,
    reason: string | undefined,
    userId: string,
  ): Promise<Contract> {
    const contract = await this.findContractById(id, orgId);

    const fromStatus = contract.status;
    contractStateMachine.validateTransition(contract.status, 'terminated' as ContractStatus);

    await this.contractRepository.update(id, {
      status: 'terminated',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(
      contractStatusChanged({
        orgId,
        contractId: id,
        fromStatus,
        toStatus: 'terminated',
        reason,
        actorType: 'user',
        actorId: userId,
      }),
    );

    return this.findContractById(id, orgId);
  }

  async deleteContract(id: string, orgId: string, userId: string): Promise<void> {
    const contract = await this.findContractById(id, orgId);

    if (!['draft', 'rejected'].includes(contract.status)) {
      throw new ConflictException('STATUS_TRANSITION_INVALID');
    }

    await this.contractRepository.update(id, {
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }

  private async generateContractNo(orgId: string): Promise<string> {
    const count = await this.contractRepository.count({ where: { orgId } });
    const seq = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `CT-${year}-${seq}`;
  }
}
