import { StateMachine } from '../state-machine';

export type SubscriptionStatus = 'trial' | 'active' | 'overdue' | 'suspended' | 'expired' | 'cancelled';

export const subscriptionStateMachine = new StateMachine<SubscriptionStatus>({
  name: 'SM-subscription',
  states: ['trial', 'active', 'overdue', 'suspended', 'expired', 'cancelled'],
  initialState: 'trial',
  terminalStates: ['expired', 'cancelled'],
  transitions: [
    { from: 'trial', to: 'active' },
    { from: 'active', to: 'overdue' },
    { from: 'overdue', to: 'active' },
    { from: 'overdue', to: 'suspended' },
    { from: 'suspended', to: 'active' },
    { from: 'suspended', to: 'expired' },
    { from: 'active', to: 'cancelled' },
  ],
});
