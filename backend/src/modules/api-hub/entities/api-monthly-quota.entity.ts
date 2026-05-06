import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("api_monthly_quota")
export class ApiMonthlyQuota {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  projectId!: string;

  @Column({ type: "uuid" })
  modelId!: string;

  @Column({ type: "varchar", length: 7 })
  period!: string;

  @Column({ type: "varchar", length: 20, default: "token" })
  quotaUnit!: string;

  @Column({ type: "bigint", default: 0 })
  quotaLimit!: number;

  @Column({ type: "bigint", default: 0 })
  quotaUsed!: number;

  @Column({ type: "timestamptz", nullable: true })
  resetAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
