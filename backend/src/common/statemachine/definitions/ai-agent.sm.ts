import { StateMachine } from '../state-machine';

export type AgentStatus = 'draft' | 'active' | 'paused' | 'archived';

export const aiAgentStateMachine = new StateMachine<AgentStatus>({
  name: 'SM-ai_agent',
  states: ['draft', 'active', 'paused', 'archived'],
  initialState: 'draft',
  terminalStates: ['archived'],
  transitions: [
    { from: 'draft', to: 'active' },
    { from: 'active', to: 'paused' },
    { from: 'active', to: 'archived' },
    { from: 'paused', to: 'active' },
    { from: 'paused', to: 'archived' },
  ],
});
