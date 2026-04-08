import { StateMachine } from '../state-machine';

export type LeadStatus = 'new' | 'assigned' | 'following' | 'converted' | 'invalid';

export const leadStateMachine = new StateMachine<LeadStatus>({
  name: 'SM-lead',
  states: ['new', 'assigned', 'following', 'converted', 'invalid'],
  initialState: 'new',
  terminalStates: ['converted', 'invalid'],
  transitions: [
    { from: 'new', to: 'assigned' },
    { from: 'new', to: 'invalid' },
    { from: 'assigned', to: 'following' },
    { from: 'assigned', to: 'invalid' },
    { from: 'following', to: 'converted' },
    { from: 'following', to: 'invalid' },
  ],
});
