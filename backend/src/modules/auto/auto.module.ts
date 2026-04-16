import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationTrigger } from './entities/automation-trigger.entity';
import { AutomationFlow } from './entities/automation-flow.entity';
import { AutomationRun } from './entities/automation-run.entity';
import { AutomationStep } from './entities/automation-step.entity';
import { AutoController } from './auto.controller';
import { AutoService } from './auto.service';
import { AutoEventHandler } from './auto-event-handler.service';
import { AutoActionExecutor } from './auto-action-executor.service';
import { FlowService } from './flow.service';
import { EventsModule } from '../../common/events/events.module';
import { NtfModule } from '../ntf/ntf.module';
import { CsmModule } from '../csm/csm.module';
import { TskModule } from '../tsk/tsk.module';
import { CmModule } from '../cm/cm.module';
import { DlvModule } from '../dlv/dlv.module';
import { ApprovalCenterModule } from '../approval-center/approval-center.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationTrigger, AutomationFlow, AutomationRun, AutomationStep]),
    EventsModule,
    NtfModule,
    CsmModule,
    TskModule,
    CmModule,
    DlvModule,
    ApprovalCenterModule,
  ],
  controllers: [AutoController],
  providers: [AutoService, AutoEventHandler, AutoActionExecutor, FlowService],
  exports: [AutoService, FlowService],
})
export class AutoModule {}
