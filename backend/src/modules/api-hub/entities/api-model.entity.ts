import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type ApiModelStatus = "internal" | "public" | "deprecated";
export type ApiModelCategory = "text" | "image" | "audio" | "video" | "embedding";

@Entity("api_models")
export class ApiModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 50, default: "" })
  provider!: string;

  @Column({ type: "varchar", length: 100 })
  modelId!: string;

  @Column({ type: "varchar", length: 15, default: "text" })
  category!: ApiModelCategory;

  @Column({ type: "varchar", length: 128, nullable: true })
  upstreamModel!: string | null;

  @Column({ type: "varchar", length: 20, default: "token" })
  pricingUnit!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  unitLabel!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 20, default: "internal" })
  status!: ApiModelStatus;

  @Column({ type: "integer", nullable: true })
  maxInputTokens!: number | null;

  @Column({ type: "integer", nullable: true })
  maxOutputTokens!: number | null;

  @Column({ type: "boolean", default: false })
  supportsStreaming!: boolean;

  @Column({ type: "boolean", default: false })
  supportsVision!: boolean;

  @Column({ type: "boolean", default: false })
  supportsFunctionCalling!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
