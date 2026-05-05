import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type GeoReportStatus = "draft" | "ready" | "delivered" | "archived";

@Entity("geo_reports")
export class GeoReport {
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

  @Column({ name: "contact_name", type: "varchar", length: 100, nullable: true })
  contactName: string | null;

  @Index()
  @Column({ type: "varchar", length: 20, default: "draft" })
  status: GeoReportStatus;

  @Column({ name: "diagnosis_date", type: "date", nullable: true })
  diagnosisDate: string | null;

  @Column({ type: "jsonb", nullable: true })
  platforms: string[] | null;

  @Column({ type: "text", nullable: true })
  competitors: string | null;

  @Column({ name: "target_questions", type: "text", nullable: true })
  targetQuestions: string | null;

  @Column({ name: "test_results", type: "jsonb", nullable: true })
  testResults: any[] | null;

  @Column({ name: "visibility_summary", type: "text", nullable: true })
  visibilitySummary: string | null;

  @Column({ name: "main_problems", type: "text", nullable: true })
  mainProblems: string | null;

  @Column({ type: "text", nullable: true })
  opportunities: string | null;

  @Column({ name: "recommended_actions", type: "text", nullable: true })
  recommendedActions: string | null;

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
