export class TakeoverQueryDto {
  agentRunId?: string;
  page?: number = 1;
  pageSize?: number = 20;
}

export class ResolveTakeoverDto {
  resolution: string;
}
