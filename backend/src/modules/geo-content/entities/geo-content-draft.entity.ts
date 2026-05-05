import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export type DraftStatus = "draft" | "reviewing" | "approved" | "published" | "archived";

@Entity("geo_content_drafts")
export class GeoContentDraft {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "lead_id", type: "varchar", length: 36, nullable: true })
  leadId: string | null;

  @Index()
  @Column({ name: "brand_asset_id", type: "varchar", length: 36, nullable: true })
  brandAssetId: string | null;

  @Column({ name: "report_id", type: "varchar", length: 36, nullable: true })
  reportId: string | null;

  @Index()
  @Column({ name: "topic_id", type: "varchar", length: 36, nullable: true })
  topicId: string | null;

  @Index()
  @Column({ name: "plan_id", type: "varchar", length: 36, nullable: true })
  planId: string | null;

  @Column({ type: "varchar", length: 300, default: "" })
  title: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  slug: string | null;

  @Column({ name: "content_type", type: "varchar", length: 50, nullable: true })
  contentType: string | null;

  @Column({ name: "target_keyword", type: "varchar", length: 200, nullable: true })
  targetKeyword: string | null;

  @Column({ name: "target_question", type: "text", nullable: true })
  targetQuestion: string | null;

  @Column({ name: "target_audience", type: "varchar", length: 200, nullable: true })
  targetAudience: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  platform: string | null;

  @Index()
  @Column({ type: "varchar", length: 20, default: "draft" })
  status: DraftStatus;

  @Column({ type: "text", nullable: true })
  summary: string | null;

  @Column({ type: "text", nullable: true })
  outline: string | null;

  @Column({ type: "text", nullable: true })
  body: string | null;

  @Column({ type: "text", nullable: true })
  markdown: string | null;

  @Column({ name: "seo_title", type: "varchar", length: 300, nullable: true })
  seoTitle: string | null;

  @Column({ name: "meta_description", type: "varchar", length: 500, nullable: true })
  metaDescription: string | null;

  @Column({ type: "jsonb", nullable: true })
  tags: string[] | null;

  @Column({ name: "compliance_checklist", type: "jsonb", nullable: true })
  complianceChecklist: string[] | null;

  @Column({ name: "review_notes", type: "text", nullable: true })
  reviewNotes: string | null;

  @Column({ name: "published_url", type: "varchar", length: 500, nullable: true })
  publishedUrl: string | null;

  @Column({ name: "planned_publish_date", type: "date", nullable: true })
  plannedPublishDate: string | null;

  @Column({ name: "actual_publish_date", type: "date", nullable: true })
  actualPublishDate: string | null;

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
