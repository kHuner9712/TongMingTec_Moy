import { StateMachine } from '../state-machine';

export type BillStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export const billStateMachine = new StateMachine<BillStatus>({
  name: 'SM-bill',
  states: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'],
  initialState: 'draft',
  terminalStates: ['paid', 'cancelled'],
  transitions: [
    { from: 'draft', to: 'issued' },
    { from: 'draft', to: 'cancelled' },
    { from: 'issued', to: 'partially_paid' },
    { from: 'issued', to: 'paid' },
    { from: 'issued', to: 'overdue' },
    { from: 'issued', to: 'cancelled' },
    { from: 'partially_paid', to: 'paid' },
    { from: 'partially_paid', to: 'overdue' },
    { from: 'partially_paid', to: 'cancelled' },
    { from: 'overdue', to: 'partially_paid' },
    { from: 'overdue', to: 'paid' },
    { from: 'overdue', to: 'cancelled' },
  ],
});
