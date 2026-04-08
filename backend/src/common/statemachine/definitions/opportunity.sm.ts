import { StateMachine } from '../state-machine';

export type OpportunityStage = 'discovery' | 'qualification' | 'proposal' | 'negotiation';

export const opportunityStateMachine = new StateMachine<OpportunityStage>({
  name: 'SM-opportunity',
  states: ['discovery', 'qualification', 'proposal', 'negotiation'],
  initialState: 'discovery',
  terminalStates: [],
  transitions: [
    { from: 'discovery', to: 'qualification' },
    { from: 'qualification', to: 'proposal' },
    { from: 'proposal', to: 'negotiation' },
  ],
});
