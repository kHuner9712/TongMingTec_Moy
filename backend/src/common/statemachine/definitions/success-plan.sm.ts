import { StateMachine } from '../state-machine';

export type SuccessPlanStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export const successPlanStateMachine = new StateMachine<SuccessPlanStatus>({
  name: 'SM-success-plan',
  states: ['draft', 'active', 'on_hold', 'completed', 'cancelled'],
  initialState: 'draft',
  terminalStates: ['completed', 'cancelled'],
  transitions: [
    { from: 'draft', to: 'active' },
    { from: 'active', to: 'on_hold' },
    { from: 'active', to: 'completed' },
    { from: 'active', to: 'cancelled' },
    { from: 'on_hold', to: 'active' },
    { from: 'on_hold', to: 'cancelled' },
  ],
});
