import { StateMachine } from '../state-machine';

export type OrderStatus = 'draft' | 'pending_approval' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'refunded';

export const orderStateMachine = new StateMachine<OrderStatus>({
  name: 'SM-order',
  states: ['draft', 'pending_approval', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'],
  initialState: 'draft',
  terminalStates: ['completed', 'cancelled', 'refunded'],
  transitions: [
    { from: 'draft', to: 'pending_approval' },
    { from: 'pending_approval', to: 'confirmed' },
    { from: 'pending_approval', to: 'draft' },
    { from: 'confirmed', to: 'active' },
    { from: 'active', to: 'completed' },
    { from: 'confirmed', to: 'cancelled' },
    { from: 'active', to: 'refunded' },
  ],
});
