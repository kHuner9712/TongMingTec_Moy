import { PartialType } from "@nestjs/mapped-types";
import { CreateGeoReportDto } from "./create-geo-report.dto";

export class UpdateGeoReportDto extends PartialType(CreateGeoReportDto) {}
