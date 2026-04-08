import { StateMachine } from '../state-machine';

export type OrganizationStatus = 'provisioning' | 'active' | 'suspended' | 'archived';

export const organizationStateMachine = new StateMachine<OrganizationStatus>({
  name: 'SM-organization',
  states: ['provisioning', 'active', 'suspended', 'archived'],
  initialState: 'provisioning',
  terminalStates: ['archived'],
  transitions: [
    { from: 'provisioning', to: 'active' },
    { from: 'active', to: 'suspended' },
    { from: 'suspended', to: 'active' },
    { from: 'suspended', to: 'archived' },
  ],
});
