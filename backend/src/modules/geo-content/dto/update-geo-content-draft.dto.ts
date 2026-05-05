import { PartialType } from "@nestjs/mapped-types";
import { CreateGeoContentDraftDto } from "./create-geo-content-draft.dto";

export class UpdateGeoContentDraftDto extends PartialType(CreateGeoContentDraftDto) {}
