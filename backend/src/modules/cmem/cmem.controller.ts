import {
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { ContextService } from './services/context.service';
import { IntentService } from './services/intent.service';
import { RiskService } from './services/risk.service';
import { NextActionService } from './services/next-action.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { NextActionQueryDto } from './dto/next-action.dto';
import { RiskQueryDto } from './dto/risk.dto';

@Controller('cmem')
export class CmemController {
  constructor(
    private readonly contextService: ContextService,
    private readonly intentService: IntentService,
    private readonly riskService: RiskService,
    private readonly nextActionService: NextActionService,
  ) {}

  @Get('risks')
  @Permissions('PERM-CM-VIEW')
  async listRisks(
    @CurrentUser('orgId') orgId: string,
    @Query() query: RiskQueryDto,
  ) {
    return this.riskService.getRisksByOrg(orgId, query);
  }

  @Get('customers/:id/context')
  @Permissions('PERM-CM-VIEW')
  async getContext(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.contextService.getContext(id, orgId);
  }

  @Get('customers/:id/intent')
  @Permissions('PERM-CM-VIEW')
  async getIntent(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.intentService.getIntent(id, orgId);
  }

  @Get('customers/:id/risk')
  @Permissions('PERM-CM-VIEW')
  async getRisk(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.riskService.getRisk(id, orgId);
  }

  @Get('customers/:id/next-actions')
  @Permissions('PERM-CM-VIEW')
  async getNextActions(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Query() query: NextActionQueryDto,
  ) {
    return this.nextActionService.getNextActions(id, orgId, query);
  }

  @Post('customers/:id/next-actions/:actionId/accept')
  @Permissions('PERM-CM-UPDATE')
  async acceptAction(
    @Param('actionId') actionId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.nextActionService.acceptAction(actionId, orgId);
  }

  @Post('customers/:id/next-actions/:actionId/dismiss')
  @Permissions('PERM-CM-UPDATE')
  async dismissAction(
    @Param('actionId') actionId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.nextActionService.dismissAction(actionId, orgId);
  }
}
