import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskSourceType } from './entities/task.entity';

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.PENDING, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.CANCELLED]: [],
};

@Injectable()
export class TskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findTasks(
    orgId: string,
    userId: string,
    dataScope: string,
    filters: { status?: string; assignee?: string; sourceType?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Task[]; total: number }> {
    const qb = this.taskRepository
      .createQueryBuilder('task')
      .where('task.orgId = :orgId', { orgId });

    if (dataScope === 'self' || filters.assignee === 'me') {
      qb.andWhere('task.assigneeUserId = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.sourceType) {
      qb.andWhere('task.sourceType = :sourceType', {
        sourceType: filters.sourceType,
      });
    }

    qb.orderBy('task.dueAt', 'ASC', 'NULLS LAST');
    qb.addOrderBy('task.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findTaskById(id: string, orgId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, orgId },
    });

    if (!task) {
      throw new NotFoundException('RESOURCE_NOT_FOUND');
    }

    return task;
  }

  async createTask(
    orgId: string,
    data: Partial<Task>,
    _userId: string,
  ): Promise<Task> {
    const task = this.taskRepository.create({
      ...data,
      orgId,
      status: TaskStatus.PENDING,
      sourceType: data.sourceType || TaskSourceType.MANUAL,
    });

    return this.taskRepository.save(task);
  }

  async updateTask(
    id: string,
    orgId: string,
    data: Partial<Task>,
    version: number,
  ): Promise<Task> {
    const task = await this.findTaskById(id, orgId);

    if (task.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    await this.taskRepository.update(id, {
      ...data,
      version: () => 'version + 1',
    });

    return this.findTaskById(id, orgId);
  }

  async changeStatus(
    id: string,
    orgId: string,
    status: TaskStatus,
    _userId: string,
    version: number,
  ): Promise<Task> {
    const task = await this.findTaskById(id, orgId);

    if (task.version !== version) {
      throw new ConflictException('CONFLICT_VERSION');
    }

    if (!VALID_TRANSITIONS[task.status].includes(status)) {
      throw new BadRequestException('STATUS_TRANSITION_INVALID');
    }

    await this.taskRepository.update(id, {
      status,
      version: () => 'version + 1',
    });

    return this.findTaskById(id, orgId);
  }

  async remind(
    id: string,
    orgId: string,
    _message: string,
  ): Promise<void> {
    await this.findTaskById(id, orgId);
  }
}
