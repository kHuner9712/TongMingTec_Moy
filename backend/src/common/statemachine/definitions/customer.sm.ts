import { StateMachine } from '../state-machine';

export type CustomerStatus = 'potential' | 'active' | 'silent' | 'lost';

export const customerStateMachine = new StateMachine<CustomerStatus>({
  name: 'SM-customer',
  states: ['potential', 'active', 'silent', 'lost'],
  initialState: 'potential',
  terminalStates: ['lost'],
  transitions: [
    { from: 'potential', to: 'active' },
    { from: 'active', to: 'silent' },
    { from: 'active', to: 'lost' },
    { from: 'silent', to: 'active' },
    { from: 'silent', to: 'lost' },
  ],
});
