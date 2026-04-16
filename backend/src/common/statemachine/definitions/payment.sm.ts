import { StateMachine } from '../state-machine';

export type PaymentStatus = 'pending' | 'processing' | 'pending_approval' | 'succeeded' | 'failed' | 'refunded' | 'voided';

export const paymentStateMachine = new StateMachine<PaymentStatus>({
  name: 'SM-payment',
  states: ['pending', 'processing', 'pending_approval', 'succeeded', 'failed', 'refunded', 'voided'],
  initialState: 'pending',
  terminalStates: ['succeeded', 'failed', 'refunded', 'voided'],
  transitions: [
    { from: 'pending', to: 'processing' },
    { from: 'processing', to: 'pending_approval' },
    { from: 'pending_approval', to: 'succeeded' },
    { from: 'pending_approval', to: 'processing' },
    { from: 'processing', to: 'failed' },
    { from: 'succeeded', to: 'refunded' },
    { from: 'pending', to: 'voided' },
  ],
});
