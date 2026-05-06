import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type ApiProviderConfigStatus = "active" | "inactive" | "error";

@Entity("api_provider_configs")
export class ApiProviderConfig {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64, unique: true })
  provider!: string;

  @Column({ type: "varchar", length: 128 })
  displayName!: string;

  @Column({ type: "varchar", length: 512 })
  baseUrl!: string;

  @Column({ type: "varchar", length: 128 })
  apiKeyEnvName!: string;

  @Column({ type: "varchar", length: 32, default: "active" })
  status!: ApiProviderConfigStatus;

  @Column({ type: "int", default: 60000 })
  timeoutMs!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
