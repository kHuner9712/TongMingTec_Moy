import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SysService } from './sys.service';
import { OrgConfig } from './entities/org-config.entity';

describe('SysService', () => {
  let service: SysService;
  let configRepository: jest.Mocked<any>;

  const mockConfig = {
    id: 'config-uuid-123',
    orgId: 'org-uuid-123',
    configKey: 'notification.settings',
    configValue: { emailEnabled: true, smsEnabled: false },
    version: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SysService,
        {
          provide: getRepositoryToken(OrgConfig),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SysService>(SysService);
    configRepository = module.get(getRepositoryToken(OrgConfig));
  });

  describe('getConfigs', () => {
    it('should return all configs for organization', async () => {
      configRepository.find.mockResolvedValue([mockConfig]);

      const result = await service.getConfigs('org-uuid-123');

      expect(result).toHaveLength(1);
      expect(result[0].configKey).toBe('notification.settings');
    });
  });

  describe('getConfig', () => {
    it('should return config by key', async () => {
      configRepository.findOne.mockResolvedValue(mockConfig);

      const result = await service.getConfig('org-uuid-123', 'notification.settings');

      expect(result).toEqual(mockConfig);
    });

    it('should return null when config not found', async () => {
      configRepository.findOne.mockResolvedValue(null);

      const result = await service.getConfig('org-uuid-123', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('setConfig', () => {
    it('should create new config when not exists', async () => {
      configRepository.findOne.mockResolvedValueOnce(null);
      configRepository.create.mockReturnValue(mockConfig);
      configRepository.save.mockResolvedValue(mockConfig);

      const result = await service.setConfig(
        'org-uuid-123',
        'notification.settings',
        { emailEnabled: true },
      );

      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should update existing config', async () => {
      configRepository.findOne.mockResolvedValue(mockConfig);
      const mockQb: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      configRepository.createQueryBuilder.mockReturnValue(mockQb);
      configRepository.findOne.mockResolvedValue({
        ...mockConfig,
        configValue: { emailEnabled: false },
      });

      const result = await service.setConfig(
        'org-uuid-123',
        'notification.settings',
        { emailEnabled: false },
      );

      expect(mockQb.execute).toHaveBeenCalled();
    });
  });

  describe('bulkSetConfigs', () => {
    it('should set multiple configs', async () => {
      configRepository.findOne.mockResolvedValue(null);
      configRepository.create.mockReturnValue(mockConfig);
      configRepository.save.mockResolvedValue(mockConfig);

      await service.bulkSetConfigs('org-uuid-123', [
        { key: 'config1', value: { a: 1 } },
        { key: 'config2', value: { b: 2 } },
      ]);

      expect(configRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSystemSummary', () => {
    it('should return system summary with all modules', async () => {
      const result = await service.getSystemSummary('org-uuid-123') as any;

      expect(result.orgId).toBe('org-uuid-123');
      expect(result.modules).toBeDefined();
      expect(result.modules.auth.enabled).toBe(true);
      expect(result.modules.cm.enabled).toBe(true);
      expect(result.modules.lm.enabled).toBe(true);
      expect(result.modules.om.enabled).toBe(true);
      expect(result.modules.cnv.enabled).toBe(true);
      expect(result.modules.tk.enabled).toBe(true);
      expect(result.modules.ai.enabled).toBe(true);
    });

    it('should include timestamp in summary', async () => {
      const result = await service.getSystemSummary('org-uuid-123');

      expect(result.timestamp).toBeDefined();
    });
  });
});
