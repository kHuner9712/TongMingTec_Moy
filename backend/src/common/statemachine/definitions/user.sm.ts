import { StateMachine } from '../state-machine';

export type UserStatus = 'invited' | 'active' | 'disabled' | 'locked';

export const userStateMachine = new StateMachine<UserStatus>({
  name: 'SM-user',
  states: ['invited', 'active', 'disabled', 'locked'],
  initialState: 'invited',
  terminalStates: [],
  transitions: [
    { from: 'invited', to: 'active' },
    { from: 'active', to: 'disabled' },
    { from: 'disabled', to: 'active' },
    { from: 'active', to: 'locked' },
    { from: 'locked', to: 'active' },
  ],
});
