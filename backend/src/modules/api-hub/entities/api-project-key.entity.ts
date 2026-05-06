import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type ApiProjectKeyStatus = "active" | "revoked" | "expired";

@Entity("api_project_keys")
export class ApiProjectKey {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  projectId!: string;

  @Column({ type: "varchar", length: 200, default: "" })
  name!: string;

  @Column({ type: "varchar", length: 12 })
  keyPrefix!: string;

  @Column({ type: "varchar", length: 64 })
  keyHash!: string;

  @Column({ type: "varchar", length: 20, default: "active" })
  status!: ApiProjectKeyStatus;

  @Column({ type: "timestamptz", nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
