import { DomainEvent } from './domain-event';

export function aiTaskCreated(params: {
  orgId: string;
  taskId: string;
  taskType: string;
  triggerSource: string;
  targetAggregateType: string;
  targetAggregateId: string;
}): DomainEvent {
  return {
    eventType: 'ai.task_created',
    aggregateType: 'ai_task',
    aggregateId: params.taskId,
    payload: {
      taskType: params.taskType,
      triggerSource: params.triggerSource,
      targetAggregateType: params.targetAggregateType,
      targetAggregateId: params.targetAggregateId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function aiTaskCompleted(params: {
  orgId: string;
  taskId: string;
  taskType: string;
  result: string;
  targetAggregateType: string;
  targetAggregateId: string;
}): DomainEvent {
  return {
    eventType: 'ai.task_completed',
    aggregateType: 'ai_task',
    aggregateId: params.taskId,
    payload: {
      taskType: params.taskType,
      result: params.result,
      targetAggregateType: params.targetAggregateType,
      targetAggregateId: params.targetAggregateId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
