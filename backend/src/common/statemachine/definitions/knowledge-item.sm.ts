import { StateMachine } from '../state-machine';

export type KnowledgeItemStatus = 'draft' | 'review' | 'published' | 'archived';

export const knowledgeItemStateMachine = new StateMachine<KnowledgeItemStatus>({
  name: 'SM-knowledge_item',
  states: ['draft', 'review', 'published', 'archived'],
  initialState: 'draft',
  terminalStates: ['archived'],
  transitions: [
    { from: 'draft', to: 'review' },
    { from: 'review', to: 'published' },
    { from: 'review', to: 'draft' },
    { from: 'published', to: 'archived' },
    { from: 'archived', to: 'draft' },
  ],
});
