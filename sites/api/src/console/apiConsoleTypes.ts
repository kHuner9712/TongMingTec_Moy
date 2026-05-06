export interface ApiProjectDTO {
  id: string;
  orgId: string | null;
  userId: string | null;
  name: string;
  description: string | null;
  status: "active" | "suspended" | "archived";
  defaultModelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiModelDTO {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  category: string;
  pricingUnit: string;
  unitLabel: string | null;
  description: string | null;
  status: "internal" | "public" | "deprecated";
  maxInputTokens: number | null;
  maxOutputTokens: number | null;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProjectModelDTO {
  id: string;
  projectId: string;
  modelId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  model?: ApiModelDTO;
}

export interface ApiMonthlyQuotaDTO {
  id: string;
  projectId: string;
  modelId: string;
  modelName?: string;
  period: string;
  quotaUnit: string;
  quotaLimit: number;
  quotaUsed: number;
  usagePercent: number;
  resetAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeySafeDTO {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  status: "active" | "revoked" | "expired";
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyCreatedDTO extends ApiKeySafeDTO {
  key: string;
}

export interface RemainingQuotaDTO {
  remaining: number;
  used: number;
  limit: number;
}

export interface ApiErrorResponse {
  error?: {
    message: string;
    type: string;
    code: string;
  };
  message?: string;
}
