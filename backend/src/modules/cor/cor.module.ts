import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerTimelineEvent } from "./entities/customer-timeline-event.entity";
import { CustomerOperatingRecord } from "./entities/customer-operating-record.entity";
import { CustomerStateSnapshot } from "./entities/customer-state-snapshot.entity";
import { TimelineService } from "./services/timeline.service";
import { Customer360Service } from "./services/customer-360.service";
import { OperatingRecordService } from "./services/operating-record.service";
import { SnapshotService } from "./services/snapshot.service";
import { CorController } from "./cor.controller";
import { CmModule } from "../cm/cm.module";
import { LmModule } from "../lm/lm.module";
import { OmModule } from "../om/om.module";
import { CnvModule } from "../cnv/cnv.module";
import { TkModule } from "../tk/tk.module";
import { CmemModule } from "../cmem/cmem.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerTimelineEvent,
      CustomerOperatingRecord,
      CustomerStateSnapshot,
    ]),
    CmModule,
    LmModule,
    OmModule,
    CnvModule,
    TkModule,
    CmemModule,
  ],
  controllers: [CorController],
  providers: [
    TimelineService,
    Customer360Service,
    OperatingRecordService,
    SnapshotService,
  ],
  exports: [
    TimelineService,
    Customer360Service,
    OperatingRecordService,
    SnapshotService,
  ],
})
export class CorModule {}
