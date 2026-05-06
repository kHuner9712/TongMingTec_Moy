import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("api_usage_records")
export class ApiUsageRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  projectId!: string;

  @Column({ type: "uuid" })
  keyId!: string;

  @Column({ type: "uuid" })
  modelId!: string;

  @Column({ type: "varchar", length: 64, nullable: true })
  requestId!: string | null;

  @Column({ type: "integer", default: 0 })
  inputTokens!: number;

  @Column({ type: "integer", default: 0 })
  outputTokens!: number;

  @Column({ type: "integer", default: 0 })
  totalTokens!: number;

  @Column({ type: "decimal", precision: 12, scale: 6, default: 0 })
  cost!: number;

  @Column({ type: "varchar", length: 20, default: "success" })
  status!: string;

  @Column({ type: "text", nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
