import { StateMachine } from '../state-machine';

export type ConversationStatus = 'queued' | 'waiting' | 'active' | 'paused' | 'closed';

export const conversationStateMachine = new StateMachine<ConversationStatus>({
  name: 'SM-conversation',
  states: ['queued', 'waiting', 'active', 'paused', 'closed'],
  initialState: 'queued',
  terminalStates: ['closed'],
  transitions: [
    { from: 'queued', to: 'waiting' },
    { from: 'queued', to: 'active' },
    { from: 'queued', to: 'closed' },
    { from: 'waiting', to: 'active' },
    { from: 'waiting', to: 'closed' },
    { from: 'active', to: 'paused' },
    { from: 'active', to: 'closed' },
    { from: 'paused', to: 'active' },
    { from: 'paused', to: 'closed' },
  ],
});
