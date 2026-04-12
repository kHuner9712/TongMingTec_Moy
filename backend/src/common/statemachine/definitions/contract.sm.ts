import { StateMachine } from '../state-machine';

export type ContractStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'signing' | 'active' | 'expired' | 'terminated';

export const contractStateMachine = new StateMachine<ContractStatus>({
  name: 'SM-contract',
  states: ['draft', 'pending_approval', 'approved', 'rejected', 'signing', 'active', 'expired', 'terminated'],
  initialState: 'draft',
  terminalStates: ['rejected', 'expired', 'terminated'],
  transitions: [
    { from: 'draft', to: 'pending_approval' },
    { from: 'pending_approval', to: 'approved' },
    { from: 'pending_approval', to: 'rejected' },
    { from: 'approved', to: 'signing' },
    { from: 'signing', to: 'active' },
    { from: 'active', to: 'expired' },
    { from: 'active', to: 'terminated' },
  ],
});
