import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CorModule } from "../cor/cor.module";
import { CmemModule } from "../cmem/cmem.module";
import { ArtModule } from "../art/art.module";
import { ApprovalCenterModule } from "../approval-center/approval-center.module";
import { TakeoverCenterModule } from "../takeover-center/takeover-center.module";
import { RollbackCenterModule } from "../rollback-center/rollback-center.module";
import { Customer } from "../cm/entities/customer.entity";
import { AiRuntimeService } from "./ai-runtime.service";
import { AiRuntimeController } from "./ai-runtime.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    CorModule,
    CmemModule,
    ArtModule,
    ApprovalCenterModule,
    TakeoverCenterModule,
    RollbackCenterModule,
  ],
  controllers: [AiRuntimeController],
  providers: [AiRuntimeService],
  exports: [AiRuntimeService],
})
export class AiRuntimeModule {}
