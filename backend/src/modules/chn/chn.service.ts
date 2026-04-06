import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel, ChannelStatus } from './entities/channel.entity';

@Injectable()
export class ChnService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async findChannels(
    orgId: string,
    filters: { channelType?: string; status?: string },
  ): Promise<Channel[]> {
    const qb = this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.orgId = :orgId', { orgId });

    if (filters.channelType) {
      qb.andWhere('channel.channelType = :channelType', {
        channelType: filters.channelType,
      });
    }

    if (filters.status) {
      qb.andWhere('channel.status = :status', { status: filters.status });
    }

    return qb.orderBy('channel.createdAt', 'DESC').getMany();
  }

  async findChannelById(id: string, orgId: string): Promise<Channel> {
    return this.channelRepository.findOne({
      where: { id, orgId },
    }) as Promise<Channel>;
  }

  async createChannel(
    orgId: string,
    data: Partial<Channel>,
  ): Promise<Channel> {
    const channel = this.channelRepository.create({
      ...data,
      orgId,
      status: ChannelStatus.INACTIVE,
    });

    return this.channelRepository.save(channel);
  }

  async updateChannel(
    id: string,
    orgId: string,
    data: Partial<Channel>,
    version: number,
  ): Promise<Channel> {
    const updateData: Partial<Channel> = {
      ...data,
      version: undefined,
    };
    await this.channelRepository.update(id, {
      ...updateData,
      version: () => 'version + 1',
    } as any);

    return this.findChannelById(id, orgId);
  }
}
