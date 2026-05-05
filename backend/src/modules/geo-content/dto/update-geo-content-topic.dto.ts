import { PartialType } from "@nestjs/mapped-types";
import { CreateGeoContentTopicDto } from "./create-geo-content-topic.dto";

export class UpdateGeoContentTopicDto extends PartialType(CreateGeoContentTopicDto) {}
