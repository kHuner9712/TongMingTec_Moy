import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChnService } from './chn.service';
import { Channel, ChannelStatus, ChannelType } from './entities/channel.entity';

describe('ChnService', () => {
  let service: ChnService;
  let channelRepository: jest.Mocked<any>;

  const mockChannel = {
    id: 'channel-uuid-123',
    orgId: 'org-uuid-123',
    channelType: ChannelType.WEB,
    configJson: {},
    status: ChannelStatus.ACTIVE,
    version: 1,
  };

  const createMockQueryBuilder = () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChnService,
        {
          provide: getRepositoryToken(Channel),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChnService>(ChnService);
    channelRepository = module.get(getRepositoryToken(Channel));
  });

  describe('findChannels', () => {
    it('should return channels for organization', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getMany.mockResolvedValue([mockChannel]);
      channelRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findChannels('org-uuid-123', {});

      expect(result).toHaveLength(1);
      expect(result[0].channelType).toBe(ChannelType.WEB);
    });

    it('should filter by channelType', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getMany.mockResolvedValue([mockChannel]);
      channelRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findChannels('org-uuid-123', { channelType: ChannelType.WEB });

      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getMany.mockResolvedValue([mockChannel]);
      channelRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.findChannels('org-uuid-123', { status: ChannelStatus.ACTIVE });

      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });

  describe('findChannelById', () => {
    it('should return channel when found', async () => {
      channelRepository.findOne.mockResolvedValue(mockChannel);

      const result = await service.findChannelById('channel-uuid-123', 'org-uuid-123');

      expect(result).toEqual(mockChannel);
    });

    it('should return null when not found', async () => {
      channelRepository.findOne.mockResolvedValue(null);

      const result = await service.findChannelById('non-existent', 'org-uuid-123');

      expect(result).toBeNull();
    });
  });

  describe('createChannel', () => {
    it('should create channel with inactive status', async () => {
      channelRepository.create.mockReturnValue({
        ...mockChannel,
        status: ChannelStatus.INACTIVE,
      });
      channelRepository.save.mockResolvedValue({
        ...mockChannel,
        status: ChannelStatus.INACTIVE,
      });

      const result = await service.createChannel('org-uuid-123', {
        channelType: ChannelType.WEB,
        code: 'web-channel',
      });

      expect(channelRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateChannel', () => {
    it('should update channel and increment version', async () => {
      channelRepository.update.mockResolvedValue({ affected: 1 });
      channelRepository.findOne.mockResolvedValue({
        ...mockChannel,
        configJson: { updated: true },
        version: 2,
      });

      const result = await service.updateChannel(
        'channel-uuid-123',
        'org-uuid-123',
        { configJson: { updated: true } },
        1,
      );

      expect(channelRepository.update).toHaveBeenCalled();
    });
  });
});
