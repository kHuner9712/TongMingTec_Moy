import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type GeoLeadStatus =
  | "received"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "won"
  | "lost"
  | "archived";

@Entity("geo_leads")
export class GeoLead {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "company_name", type: "varchar", length: 200 })
  companyName: string;

  @Column({ name: "brand_name", type: "varchar", length: 200 })
  brandName: string;

  @Column({ type: "varchar", length: 500 })
  website: string;

  @Column({ type: "varchar", length: 100 })
  industry: string;

  @Column({ name: "target_city", type: "varchar", length: 100, nullable: true })
  targetCity: string | null;

  @Column({ type: "text", nullable: true })
  competitors: string | null;

  @Column({ name: "contact_name", type: "varchar", length: 100 })
  contactName: string;

  @Column({ name: "contact_method", type: "varchar", length: 100 })
  contactMethod: string;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "varchar", length: 50, default: "geo_website_form" })
  source: string;

  @Index()
  @Column({ type: "varchar", length: 20, default: "received" })
  status: GeoLeadStatus;

  @Column({ name: "assigned_to", type: "uuid", nullable: true })
  assignedTo: string | null;

  @Column({ name: "first_contacted_at", type: "timestamptz", nullable: true })
  firstContactedAt: Date | null;

  @Column({
    name: "converted_to_customer_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  convertedToCustomerId: string | null;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
