import { StateMachine } from '../state-machine';

export type DeliveryStatus =
  | 'draft'
  | 'active'
  | 'blocked'
  | 'ready_for_acceptance'
  | 'accepted'
  | 'closed';

export const deliveryStateMachine = new StateMachine<DeliveryStatus>({
  name: 'SM-delivery',
  states: [
    'draft',
    'active',
    'blocked',
    'ready_for_acceptance',
    'accepted',
    'closed',
  ],
  initialState: 'draft',
  terminalStates: ['closed'],
  transitions: [
    { from: 'draft', to: 'active' },
    { from: 'active', to: 'blocked' },
    { from: 'blocked', to: 'active' },
    { from: 'active', to: 'ready_for_acceptance' },
    { from: 'blocked', to: 'ready_for_acceptance' },
    { from: 'ready_for_acceptance', to: 'blocked' },
    { from: 'ready_for_acceptance', to: 'accepted' },
    { from: 'accepted', to: 'closed' },
  ],
});
