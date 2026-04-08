export class ApprovalQueryDto {
  status?: string;
  page?: number = 1;
  pageSize?: number = 20;
}

export class ApprovalRejectDto {
  reason?: string;
}
