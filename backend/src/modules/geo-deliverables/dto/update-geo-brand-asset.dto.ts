import { PartialType } from "@nestjs/mapped-types";
import { CreateGeoBrandAssetDto } from "./create-geo-brand-asset.dto";

export class UpdateGeoBrandAssetDto extends PartialType(CreateGeoBrandAssetDto) {}
