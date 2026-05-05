import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export type PlanStatus = "draft" | "active" | "completed" | "archived";

@Entity("geo_content_plans")
export class GeoContentPlan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "lead_id", type: "varchar", length: 36, nullable: true })
  leadId: string | null;

  @Index()
  @Column({ name: "brand_asset_id", type: "varchar", length: 36, nullable: true })
  brandAssetId: string | null;

  @Column({ type: "varchar", length: 300, default: "" })
  title: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  month: string | null;

  @Column({ type: "text", nullable: true })
  goal: string | null;

  @Column({ name: "target_platforms", type: "jsonb", nullable: true })
  targetPlatforms: string[] | null;

  @Column({ type: "jsonb", nullable: true })
  topics: string[] | null;

  @Index()
  @Column({ type: "varchar", length: 20, default: "draft" })
  status: PlanStatus;

  @Column({ type: "text", nullable: true })
  summary: string | null;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string | null;

  @Index()
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
