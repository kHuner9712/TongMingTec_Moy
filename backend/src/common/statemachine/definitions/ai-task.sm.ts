import { StateMachine } from '../state-machine';

export type AiTaskStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export const aiTaskStateMachine = new StateMachine<AiTaskStatus>({
  name: 'SM-ai_task',
  states: ['pending', 'running', 'succeeded', 'failed', 'cancelled'],
  initialState: 'pending',
  terminalStates: ['succeeded', 'failed', 'cancelled'],
  transitions: [
    { from: 'pending', to: 'running' },
    { from: 'running', to: 'succeeded' },
    { from: 'running', to: 'failed' },
    { from: 'pending', to: 'cancelled' },
    { from: 'running', to: 'cancelled' },
  ],
});
