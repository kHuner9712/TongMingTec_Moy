import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import { PageQueryDto } from '../../../common/dto/pagination.dto';
import { DeliveryStatus } from '../../../common/statemachine/definitions/delivery.sm';
import { DeliveryMilestoneStatus } from '../entities/delivery-milestone.entity';
import { DeliveryTaskStatus } from '../entities/delivery-task.entity';
import { DeliveryAcceptanceResult } from '../entities/delivery-acceptance.entity';
import { DeliveryRiskSeverity, DeliveryRiskStatus } from '../entities/delivery-risk.entity';
import { DeliveryOutcomeStatus } from '../entities/delivery-outcome.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'Q2 交付实施' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: '交付范围、里程碑与验收标准说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ example: '24dd314b-bac1-4502-bf68-3a2cb204f26a' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({ example: '35d267f8-d9d1-4a70-b8ec-5786fdbb2b18' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ example: '58f8a7f8-d9d1-4a70-b8ec-5786fdbb2b19' })
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @ApiPropertyOptional({ example: '63a3ea93-c41d-4fef-8ba8-b68f5cf3cf14' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({ example: '7f3d9a93-c41d-4fef-8ba8-b68f5cf3cf15' })
  @IsOptional()
  @IsUUID()
  successPlanId?: string;

  @ApiPropertyOptional({ example: 'fdcc8ad6-2b94-4ae6-b4a9-a75baf4b0df3' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiPropertyOptional({ example: '在 2026-Q2 内完成上线并通过客户验收' })
  @IsOptional()
  @IsString()
  targetOutcomeSummary?: string;
}

export class UpdateDeliveryDto {
  @ApiPropertyOptional({ example: 'Q2 交付实施（更新）' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '补充交付说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '58f8a7f8-d9d1-4a70-b8ec-5786fdbb2b19' })
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @ApiPropertyOptional({ example: '63a3ea93-c41d-4fef-8ba8-b68f5cf3cf14' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({ example: '7f3d9a93-c41d-4fef-8ba8-b68f5cf3cf15' })
  @IsOptional()
  @IsUUID()
  successPlanId?: string;

  @ApiPropertyOptional({ example: 'fdcc8ad6-2b94-4ae6-b4a9-a75baf4b0df3' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiPropertyOptional({ example: '更新后的目标结果说明' })
  @IsOptional()
  @IsString()
  targetOutcomeSummary?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class ChangeDeliveryStatusDto {
  @ApiProperty({ enum: ['draft', 'active', 'blocked', 'ready_for_acceptance', 'accepted', 'closed'] })
  @IsEnum(['draft', 'active', 'blocked', 'ready_for_acceptance', 'accepted', 'closed'])
  status: DeliveryStatus;

  @ApiPropertyOptional({ example: '里程碑已完成，进入验收阶段' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  version: number;
}

export class DeliveryListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'active', 'blocked', 'ready_for_acceptance', 'accepted', 'closed'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'blocked', 'ready_for_acceptance', 'accepted', 'closed'])
  status?: DeliveryStatus;

  @ApiPropertyOptional({ example: 'a808204d-40a4-4a2f-8a5d-f86c06a8bc42' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: '35d267f8-d9d1-4a70-b8ec-5786fdbb2b18' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ example: '63a3ea93-c41d-4fef-8ba8-b68f5cf3cf14' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;
}

export class CreateMilestoneDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sequence?: number;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsEnum(['pending', 'done', 'blocked'])
  status?: DeliveryMilestoneStatus;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sequence?: number;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsEnum(['pending', 'done', 'blocked'])
  status?: DeliveryMilestoneStatus;

  @IsInt()
  @Min(1)
  version: number;
}

export class CreateDeliveryTaskDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class UpdateDeliveryTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'done', 'blocked'])
  status?: DeliveryTaskStatus;

  @IsInt()
  @Min(1)
  version: number;
}

export class CreateAcceptanceDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  acceptanceType?: string;

  @IsOptional()
  @IsEnum(['pending', 'accepted', 'rejected'])
  result?: DeliveryAcceptanceResult;

  @IsString()
  summary: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class CreateRiskDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  mitigationPlan?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: DeliveryRiskSeverity;

  @IsOptional()
  @IsEnum(['open', 'mitigated', 'closed'])
  status?: DeliveryRiskStatus;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;
}

export class UpdateRiskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  mitigationPlan?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: DeliveryRiskSeverity;

  @IsOptional()
  @IsEnum(['open', 'mitigated', 'closed'])
  status?: DeliveryRiskStatus;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsInt()
  @Min(1)
  version: number;
}

export class CreateOutcomeDto {
  @IsString()
  @MaxLength(64)
  outcomeCode: string;

  @IsString()
  promisedValue: string;

  @IsOptional()
  @IsString()
  actualValue?: string;

  @IsOptional()
  @IsEnum(['pending', 'achieved', 'partial', 'not_achieved'])
  status?: DeliveryOutcomeStatus;

  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateOutcomeDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  outcomeCode?: string;

  @IsOptional()
  @IsString()
  promisedValue?: string;

  @IsOptional()
  @IsString()
  actualValue?: string;

  @IsOptional()
  @IsEnum(['pending', 'achieved', 'partial', 'not_achieved'])
  status?: DeliveryOutcomeStatus;

  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsInt()
  @Min(1)
  version: number;
}
