import { StateMachine } from '../state-machine';

export type TicketStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export const ticketStateMachine = new StateMachine<TicketStatus>({
  name: 'SM-ticket',
  states: ['pending', 'assigned', 'in_progress', 'resolved', 'closed'],
  initialState: 'pending',
  terminalStates: ['closed'],
  transitions: [
    { from: 'pending', to: 'assigned' },
    { from: 'pending', to: 'closed' },
    { from: 'assigned', to: 'in_progress' },
    { from: 'assigned', to: 'pending' },
    { from: 'assigned', to: 'closed' },
    { from: 'in_progress', to: 'resolved' },
    { from: 'in_progress', to: 'assigned' },
    { from: 'resolved', to: 'closed' },
    { from: 'resolved', to: 'in_progress' },
  ],
});
