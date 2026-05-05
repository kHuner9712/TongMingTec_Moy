import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type GeoBrandAssetStatus = "draft" | "ready" | "reviewed" | "delivered" | "archived";

@Entity("geo_brand_assets")
export class GeoBrandAsset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "lead_id", type: "varchar", length: 36, nullable: true })
  leadId: string | null;

  @Column({ type: "varchar", length: 200, default: "" })
  title: string;

  @Column({ name: "company_name", type: "varchar", length: 200, default: "" })
  companyName: string;

  @Column({ name: "brand_name", type: "varchar", length: 200, default: "" })
  brandName: string;

  @Column({ type: "varchar", length: 500, default: "" })
  website: string;

  @Column({ type: "varchar", length: 100, default: "" })
  industry: string;

  @Column({ name: "target_city", type: "varchar", length: 100, nullable: true })
  targetCity: string | null;

  @Index()
  @Column({ type: "varchar", length: 20, default: "draft" })
  status: GeoBrandAssetStatus;

  @Column({ name: "basic_info", type: "jsonb", nullable: true })
  basicInfo: any | null;

  @Column({ name: "company_intro", type: "jsonb", nullable: true })
  companyIntro: any | null;

  @Column({ name: "service_items", type: "jsonb", nullable: true })
  serviceItems: any[] | null;

  @Column({ type: "jsonb", nullable: true })
  advantages: any[] | null;

  @Column({ type: "jsonb", nullable: true })
  cases: any[] | null;

  @Column({ type: "jsonb", nullable: true })
  faqs: any[] | null;

  @Column({ name: "competitor_diffs", type: "jsonb", nullable: true })
  competitorDiffs: any[] | null;

  @Column({ name: "compliance_materials", type: "jsonb", nullable: true })
  complianceMaterials: any | null;

  @Column({ type: "text", nullable: true })
  markdown: string | null;

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
