import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TskService } from './tsk.service';
import { Task, TaskStatus, TaskSourceType } from './entities/task.entity';
import { EventBusService } from '../../common/events/event-bus.service';

describe('TskService', () => {
  let service: TskService;
  let taskRepository: jest.Mocked<any>;

  const mockTask = {
    id: 'task-uuid-123',
    orgId: 'org-uuid-123',
    title: 'Test Task',
    description: 'Task description',
    status: TaskStatus.PENDING,
    assigneeUserId: 'user-uuid-123',
    sourceType: TaskSourceType.MANUAL,
    dueAt: null,
    version: 1,
  };

  const createMockQueryBuilder = () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: EventBusService,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TskService>(TskService);
    taskRepository = module.get(getRepositoryToken(Task));
  });

  describe('findTasks', () => {
    it('should return paginated tasks', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockTask], 1]);
      taskRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findTasks(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        {},
        1,
        10,
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by self dataScope', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockTask], 1]);
      taskRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findTasks(
        'org-uuid-123',
        'user-uuid-123',
        'self',
        {},
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockTask], 1]);
      taskRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findTasks(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        { status: 'pending' },
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by sourceType', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[mockTask], 1]);
      taskRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findTasks(
        'org-uuid-123',
        'user-uuid-123',
        'org',
        { sourceType: 'manual' },
        1,
        10,
      );

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('findTaskById', () => {
    it('should return task when found', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findTaskById('task-uuid-123', 'org-uuid-123');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findTaskById('non-existent', 'org-uuid-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTask', () => {
    it('should create task with pending status', async () => {
      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      const result = await service.createTask(
        'org-uuid-123',
        { title: 'New Task', assigneeUserId: 'user-uuid-123' },
        'creator-uuid',
      );

      expect(taskRepository.save).toHaveBeenCalled();
    });

    it('should create task with default sourceType', async () => {
      taskRepository.create.mockReturnValue({
        ...mockTask,
        sourceType: TaskSourceType.MANUAL,
      });
      taskRepository.save.mockResolvedValue({
        ...mockTask,
        sourceType: TaskSourceType.MANUAL,
      });

      const result = await service.createTask(
        'org-uuid-123',
        { title: 'New Task' },
        'creator-uuid',
      );

      expect(taskRepository.create).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update task with valid version', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateTask(
        'task-uuid-123',
        'org-uuid-123',
        { title: 'Updated Task' },
        1,
      );

      expect(taskRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException on version mismatch', async () => {
      taskRepository.findOne.mockResolvedValue({ ...mockTask, version: 2 });

      await expect(
        service.updateTask('task-uuid-123', 'org-uuid-123', {}, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changeStatus', () => {
    it('should change status with valid transition', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({
          ...mockTask,
          status: TaskStatus.IN_PROGRESS,
          version: 2,
        });
      taskRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changeStatus(
        'task-uuid-123',
        'org-uuid-123',
        TaskStatus.IN_PROGRESS,
        'user-uuid-123',
        1,
      );

      expect(taskRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException on invalid transition', async () => {
      taskRepository.findOne.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      await expect(
        service.changeStatus(
          'task-uuid-123',
          'org-uuid-123',
          TaskStatus.IN_PROGRESS,
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      taskRepository.findOne.mockResolvedValue({ ...mockTask, version: 2 });

      await expect(
        service.changeStatus(
          'task-uuid-123',
          'org-uuid-123',
          TaskStatus.IN_PROGRESS,
          'user-uuid-123',
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow transition from PENDING to COMPLETED', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({
          ...mockTask,
          status: TaskStatus.COMPLETED,
          version: 2,
        });
      taskRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changeStatus(
        'task-uuid-123',
        'org-uuid-123',
        TaskStatus.COMPLETED,
        'user-uuid-123',
        1,
      );

      expect(taskRepository.update).toHaveBeenCalled();
    });

    it('should allow transition from PENDING to CANCELLED', async () => {
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({
          ...mockTask,
          status: TaskStatus.CANCELLED,
          version: 2,
        });
      taskRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changeStatus(
        'task-uuid-123',
        'org-uuid-123',
        TaskStatus.CANCELLED,
        'user-uuid-123',
        1,
      );

      expect(taskRepository.update).toHaveBeenCalled();
    });
  });

  describe('remind', () => {
    it('should find task for reminder', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      await service.remind('task-uuid-123', 'org-uuid-123', 'Reminder message');

      expect(taskRepository.findOne).toHaveBeenCalled();
    });
  });
});
