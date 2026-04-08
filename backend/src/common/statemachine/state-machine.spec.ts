import { StateMachine } from './state-machine';
import { customerStateMachine } from './definitions/customer.sm';
import { leadStateMachine } from './definitions/lead.sm';
import { opportunityStateMachine } from './definitions/opportunity.sm';
import { conversationStateMachine } from './definitions/conversation.sm';
import { ticketStateMachine } from './definitions/ticket.sm';
import { taskStateMachine } from './definitions/task.sm';
import { organizationStateMachine } from './definitions/organization.sm';
import { userStateMachine } from './definitions/user.sm';
import { aiTaskStateMachine } from './definitions/ai-task.sm';

describe('StateMachine', () => {
  describe('base functionality', () => {
    const sm = new StateMachine<'a' | 'b' | 'c'>({
      name: 'test',
      states: ['a', 'b', 'c'],
      initialState: 'a',
      terminalStates: ['c'],
      transitions: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    });

    it('should return correct initial state', () => {
      expect(sm.canTransition('a', 'b')).toBe(true);
    });

    it('should return correct terminal states', () => {
      expect(sm.isTerminal('c')).toBe(true);
      expect(sm.isTerminal('a')).toBe(false);
    });

    it('should validate legal transition', () => {
      expect(() => sm.validateTransition('a', 'b')).not.toThrow();
    });

    it('should throw on illegal transition', () => {
      expect(() => sm.validateTransition('a', 'c')).toThrow();
    });

    it('should check canTransition correctly', () => {
      expect(sm.canTransition('a', 'b')).toBe(true);
      expect(sm.canTransition('a', 'c')).toBe(false);
      expect(sm.canTransition('b', 'c')).toBe(true);
    });

    it('should return available transitions', () => {
      expect(sm.getAvailableTransitions('a')).toEqual(['b']);
      expect(sm.getAvailableTransitions('b')).toEqual(['c']);
      expect(sm.getAvailableTransitions('c')).toEqual([]);
    });

    it('should identify terminal states', () => {
      expect(sm.isTerminal('c')).toBe(true);
      expect(sm.isTerminal('a')).toBe(false);
    });
  });

  describe('SM-customer', () => {
    it('should allow potential->active', () => {
      expect(() => customerStateMachine.validateTransition('potential', 'active')).not.toThrow();
    });

    it('should allow active->silent', () => {
      expect(() => customerStateMachine.validateTransition('active', 'silent')).not.toThrow();
    });

    it('should allow active->lost', () => {
      expect(() => customerStateMachine.validateTransition('active', 'lost')).not.toThrow();
    });

    it('should allow silent->active', () => {
      expect(() => customerStateMachine.validateTransition('silent', 'active')).not.toThrow();
    });

    it('should allow silent->lost', () => {
      expect(() => customerStateMachine.validateTransition('silent', 'lost')).not.toThrow();
    });

    it('should disallow potential->lost', () => {
      expect(() => customerStateMachine.validateTransition('potential', 'lost')).toThrow();
    });

    it('should have lost as terminal', () => {
      expect(customerStateMachine.isTerminal('lost')).toBe(true);
    });
  });

  describe('SM-lead', () => {
    it('should follow new->assigned->following->converted', () => {
      expect(() => leadStateMachine.validateTransition('new', 'assigned')).not.toThrow();
      expect(() => leadStateMachine.validateTransition('assigned', 'following')).not.toThrow();
      expect(() => leadStateMachine.validateTransition('following', 'converted')).not.toThrow();
    });

    it('should allow new->assigned', () => {
      expect(() => leadStateMachine.validateTransition('new', 'assigned')).not.toThrow();
    });

    it('should allow following->invalid', () => {
      expect(() => leadStateMachine.validateTransition('following', 'invalid')).not.toThrow();
    });

    it('should have converted and invalid as terminal', () => {
      expect(leadStateMachine.isTerminal('converted')).toBe(true);
      expect(leadStateMachine.isTerminal('invalid')).toBe(true);
    });
  });

  describe('SM-opportunity', () => {
    it('should follow discovery->qualification->proposal->negotiation', () => {
      expect(() => opportunityStateMachine.validateTransition('discovery', 'qualification')).not.toThrow();
      expect(() => opportunityStateMachine.validateTransition('qualification', 'proposal')).not.toThrow();
      expect(() => opportunityStateMachine.validateTransition('proposal', 'negotiation')).not.toThrow();
    });

    it('should disallow skipping stages', () => {
      expect(() => opportunityStateMachine.validateTransition('discovery', 'negotiation')).toThrow();
    });
  });

  describe('SM-conversation', () => {
    it('should have queued as initial state per SSOT', () => {
      expect(() => conversationStateMachine.validateTransition('queued', 'active')).not.toThrow();
    });

    it('should allow queued->active', () => {
      expect(() => conversationStateMachine.validateTransition('queued', 'active')).not.toThrow();
    });

    it('should allow queued->closed', () => {
      expect(() => conversationStateMachine.validateTransition('queued', 'closed')).not.toThrow();
    });

    it('should allow active->active (transfer)', () => {
      expect(() => conversationStateMachine.validateTransition('active', 'active')).not.toThrow();
    });

    it('should allow active->closed', () => {
      expect(() => conversationStateMachine.validateTransition('active', 'closed')).not.toThrow();
    });

    it('should have closed as terminal', () => {
      expect(conversationStateMachine.isTerminal('closed')).toBe(true);
    });

    it('should disallow queued->queued', () => {
      expect(() => conversationStateMachine.validateTransition('queued', 'queued')).toThrow();
    });
  });

  describe('SM-ticket', () => {
    it('should use processing instead of in_progress per SSOT', () => {
      expect(ticketStateMachine.getAvailableTransitions('assigned')).toContain('processing');
    });

    it('should follow pending->assigned->processing->resolved->closed', () => {
      expect(() => ticketStateMachine.validateTransition('pending', 'assigned')).not.toThrow();
      expect(() => ticketStateMachine.validateTransition('assigned', 'processing')).not.toThrow();
      expect(() => ticketStateMachine.validateTransition('processing', 'resolved')).not.toThrow();
      expect(() => ticketStateMachine.validateTransition('resolved', 'closed')).not.toThrow();
    });

    it('should allow pending->closed', () => {
      expect(() => ticketStateMachine.validateTransition('pending', 'closed')).not.toThrow();
    });

    it('should have closed as terminal', () => {
      expect(ticketStateMachine.isTerminal('closed')).toBe(true);
    });

    it('should disallow backward transitions', () => {
      expect(() => ticketStateMachine.validateTransition('processing', 'assigned')).toThrow();
      expect(() => ticketStateMachine.validateTransition('resolved', 'processing')).toThrow();
    });
  });

  describe('SM-task', () => {
    it('should follow pending->in_progress->completed', () => {
      expect(() => taskStateMachine.validateTransition('pending', 'in_progress')).not.toThrow();
      expect(() => taskStateMachine.validateTransition('in_progress', 'completed')).not.toThrow();
    });

    it('should allow pending->cancelled', () => {
      expect(() => taskStateMachine.validateTransition('pending', 'cancelled')).not.toThrow();
    });

    it('should have completed and cancelled as terminal', () => {
      expect(taskStateMachine.isTerminal('completed')).toBe(true);
      expect(taskStateMachine.isTerminal('cancelled')).toBe(true);
    });
  });

  describe('SM-organization', () => {
    it('should follow provisioning->active->suspended->archived', () => {
      expect(() => organizationStateMachine.validateTransition('provisioning', 'active')).not.toThrow();
      expect(() => organizationStateMachine.validateTransition('active', 'suspended')).not.toThrow();
      expect(() => organizationStateMachine.validateTransition('suspended', 'archived')).not.toThrow();
    });

    it('should allow suspended->active', () => {
      expect(() => organizationStateMachine.validateTransition('suspended', 'active')).not.toThrow();
    });
  });

  describe('SM-user', () => {
    it('should follow invited->active', () => {
      expect(() => userStateMachine.validateTransition('invited', 'active')).not.toThrow();
    });

    it('should allow active->disabled', () => {
      expect(() => userStateMachine.validateTransition('active', 'disabled')).not.toThrow();
    });

    it('should allow active->locked', () => {
      expect(() => userStateMachine.validateTransition('active', 'locked')).not.toThrow();
    });

    it('should allow locked->active', () => {
      expect(() => userStateMachine.validateTransition('locked', 'active')).not.toThrow();
    });
  });

  describe('SM-ai_task', () => {
    it('should follow pending->running->succeeded', () => {
      expect(() => aiTaskStateMachine.validateTransition('pending', 'running')).not.toThrow();
      expect(() => aiTaskStateMachine.validateTransition('running', 'succeeded')).not.toThrow();
    });

    it('should allow running->failed', () => {
      expect(() => aiTaskStateMachine.validateTransition('running', 'failed')).not.toThrow();
    });

    it('should allow running->cancelled', () => {
      expect(() => aiTaskStateMachine.validateTransition('running', 'cancelled')).not.toThrow();
    });

    it('should have succeeded/failed/cancelled as terminal', () => {
      expect(aiTaskStateMachine.isTerminal('succeeded')).toBe(true);
      expect(aiTaskStateMachine.isTerminal('failed')).toBe(true);
      expect(aiTaskStateMachine.isTerminal('cancelled')).toBe(true);
    });
  });
});
