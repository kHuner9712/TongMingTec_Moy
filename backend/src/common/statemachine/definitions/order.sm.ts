import { StateMachine } from '../state-machine';

export type OrderStatus = 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'refunded';

export const orderStateMachine = new StateMachine<OrderStatus>({
  name: 'SM-order',
  states: ['draft', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'],
  initialState: 'draft',
  terminalStates: ['completed', 'cancelled', 'refunded'],
  transitions: [
    { from: 'draft', to: 'confirmed' },
    { from: 'confirmed', to: 'active' },
    { from: 'active', to: 'completed' },
    { from: 'confirmed', to: 'cancelled' },
    { from: 'active', to: 'refunded' },
  ],
});
