import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export type ContentType =
  | "industry_question" | "local_service" | "competitor_comparison"
  | "buying_guide" | "misconception" | "case_study"
  | "pricing_explainer" | "process_explainer" | "brand_intro" | "faq";

export type SearchIntent = "informational" | "commercial" | "navigational" | "transactional";

export type TopicPriority = "high" | "medium" | "low";

export type TopicStatus = "idea" | "planned" | "drafting" | "reviewing" | "approved" | "published" | "archived";

@Entity("geo_content_topics")
export class GeoContentTopic {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "lead_id", type: "varchar", length: 36, nullable: true })
  leadId: string | null;

  @Index()
  @Column({ name: "brand_asset_id", type: "varchar", length: 36, nullable: true })
  brandAssetId: string | null;

  @Index()
  @Column({ name: "report_id", type: "varchar", length: 36, nullable: true })
  reportId: string | null;

  @Column({ type: "varchar", length: 300, default: "" })
  title: string;

  @Column({ name: "content_type", type: "varchar", length: 50, default: "industry_question" })
  contentType: ContentType;

  @Column({ name: "target_keyword", type: "varchar", length: 200, nullable: true })
  targetKeyword: string | null;

  @Column({ name: "target_question", type: "text", nullable: true })
  targetQuestion: string | null;

  @Column({ name: "target_audience", type: "varchar", length: 200, nullable: true })
  targetAudience: string | null;

  @Column({ name: "search_intent", type: "varchar", length: 50, nullable: true })
  searchIntent: SearchIntent | null;

  @Column({ name: "platform_suggestion", type: "varchar", length: 200, nullable: true })
  platformSuggestion: string | null;

  @Index()
  @Column({ type: "varchar", length: 20, default: "medium" })
  priority: TopicPriority;

  @Index()
  @Column({ type: "varchar", length: 20, default: "idea" })
  status: TopicStatus;

  @Column({ type: "text", nullable: true })
  outline: string | null;

  @Column({ name: "key_points", type: "jsonb", nullable: true })
  keyPoints: string[] | null;

  @Column({ name: "reference_materials", type: "jsonb", nullable: true })
  referenceMaterials: string[] | null;

  @Column({ name: "compliance_notes", type: "text", nullable: true })
  complianceNotes: string | null;

  @Column({ name: "planned_publish_date", type: "date", nullable: true })
  plannedPublishDate: string | null;

  @Column({ name: "actual_publish_date", type: "date", nullable: true })
  actualPublishDate: string | null;

  @Column({ name: "published_url", type: "varchar", length: 500, nullable: true })
  publishedUrl: string | null;

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
