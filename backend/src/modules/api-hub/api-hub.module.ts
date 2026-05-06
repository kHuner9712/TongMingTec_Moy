import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiProject } from "./entities/api-project.entity";
import { ApiProjectKey } from "./entities/api-project-key.entity";
import { ApiModel } from "./entities/api-model.entity";
import { ApiProjectModel } from "./entities/api-project-model.entity";
import { ApiMonthlyQuota } from "./entities/api-monthly-quota.entity";
import { ApiUsageRecord } from "./entities/api-usage-record.entity";
import { ApiProjectsService } from "./api-projects.service";
import { ApiKeysService } from "./api-keys.service";
import { ApiModelsService } from "./api-models.service";
import { ApiProjectModelsService } from "./api-project-models.service";
import { ApiQuotaService } from "./api-quota.service";
import { ApiUsageService } from "./api-usage.service";
import { ApiProjectsController } from "./api-projects.controller";
import { ApiKeysController } from "./api-keys.controller";
import { ApiModelsController } from "./api-models.controller";
import { ApiUsageController } from "./api-usage.controller";
import { ApiHubHealthController } from "./api-hub.controller";

@Module({
  imports: [TypeOrmModule.forFeature([ApiProject, ApiProjectKey, ApiModel, ApiProjectModel, ApiMonthlyQuota, ApiUsageRecord])],
  controllers: [ApiProjectsController, ApiKeysController, ApiModelsController, ApiUsageController, ApiHubHealthController],
  providers: [ApiProjectsService, ApiKeysService, ApiModelsService, ApiProjectModelsService, ApiQuotaService, ApiUsageService],
  exports: [ApiKeysService, ApiQuotaService, ApiUsageService],
})
export class ApiHubModule {}
