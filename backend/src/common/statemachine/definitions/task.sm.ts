import { StateMachine } from '../state-machine';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export const taskStateMachine = new StateMachine<TaskStatus>({
  name: 'SM-task',
  states: ['pending', 'in_progress', 'completed', 'cancelled'],
  initialState: 'pending',
  terminalStates: ['completed', 'cancelled'],
  transitions: [
    { from: 'pending', to: 'in_progress' },
    { from: 'pending', to: 'completed' },
    { from: 'pending', to: 'cancelled' },
    { from: 'in_progress', to: 'completed' },
    { from: 'in_progress', to: 'pending' },
    { from: 'in_progress', to: 'cancelled' },
  ],
});
