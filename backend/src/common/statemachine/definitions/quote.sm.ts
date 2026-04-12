import { StateMachine } from '../state-machine';

export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired';

export const quoteStateMachine = new StateMachine<QuoteStatus>({
  name: 'SM-quote',
  states: ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired'],
  initialState: 'draft',
  terminalStates: ['accepted', 'rejected', 'expired'],
  transitions: [
    { from: 'draft', to: 'pending_approval' },
    { from: 'pending_approval', to: 'approved' },
    { from: 'pending_approval', to: 'rejected' },
    { from: 'approved', to: 'sent' },
    { from: 'sent', to: 'accepted' },
    { from: 'sent', to: 'expired' },
  ],
});
