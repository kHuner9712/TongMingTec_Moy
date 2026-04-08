import { ToolType } from '../entities/ai-tool.entity';

export const toolSeeds = [
  {
    code: 'TOOL-READ-API',
    name: 'read_api',
    toolType: ToolType.READ_API,
    config: { allowedMethods: ['GET'], maxResults: 100 },
    riskLevel: 'low',
    enabled: true,
  },
  {
    code: 'TOOL-KB-SEARCH',
    name: 'kb_search',
    toolType: ToolType.KB_SEARCH,
    config: { maxResults: 10, searchMode: 'semantic' },
    riskLevel: 'low',
    enabled: true,
  },
  {
    code: 'TOOL-NOTIFICATION-SEND',
    name: 'notification_send',
    toolType: ToolType.NOTIFICATION_SEND,
    config: { channels: ['in_app', 'email'], rateLimitPerMinute: 10 },
    riskLevel: 'medium',
    enabled: true,
  },
];
