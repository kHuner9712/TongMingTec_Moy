import { PartialType } from "@nestjs/mapped-types";
import { CreateGeoContentPlanDto } from "./create-geo-content-plan.dto";

export class UpdateGeoContentPlanDto extends PartialType(CreateGeoContentPlanDto) {}
