import { AgentExecutionMode, AgentStatus } from '../entities/ai-agent.entity';

export const agentSeeds = [
  {
    code: 'AGENT-AI-003',
    name: 'Conversation Agent',
    agentType: 'conversation',
    executionMode: AgentExecutionMode.SUGGEST,
    status: AgentStatus.ACTIVE,
    resourceScope: { scopes: ['conversation'] },
    toolScope: { tools: ['read_api', 'kb_search'] },
    riskLevel: 'low',
    inputSchema: {
      customer_message: 'string',
      conversation_context: 'string',
      customer_summary: 'string',
    },
    outputSchema: {
      suggested_reply: 'string',
      confidence: 'number',
      intent_detected: 'string',
    },
    requiresApproval: false,
    rollbackStrategy: { strategy: 'none' },
    takeoverStrategy: { strategy: 'timeout', timeoutSeconds: 30 },
  },
];
