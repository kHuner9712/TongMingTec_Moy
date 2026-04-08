import { StateMachine } from '../state-machine';

export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export const approvalRequestStateMachine = new StateMachine<ApprovalRequestStatus>({
  name: 'SM-approval_request',
  states: ['pending', 'approved', 'rejected', 'expired', 'cancelled'],
  initialState: 'pending',
  terminalStates: ['approved', 'rejected', 'expired', 'cancelled'],
  transitions: [
    { from: 'pending', to: 'approved' },
    { from: 'pending', to: 'rejected' },
    { from: 'pending', to: 'expired' },
    { from: 'pending', to: 'cancelled' },
  ],
});
