import axios, { AxiosInstance } from "axios";
import { ProviderRequest, ProviderResponse } from "./provider-types";
import {
  ProviderTimeoutError,
  ProviderRateLimitedError,
  ProviderInvalidRequestError,
  ProviderUpstreamError,
} from "./provider-errors";

export abstract class OpenAICompatibleProviderClient {
  protected readonly http: AxiosInstance;

  constructor(
    protected readonly baseUrl: string,
    protected readonly apiKey: string,
    protected readonly timeoutMs: number,
  ) {
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: timeoutMs,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  abstract get providerName(): string;

  async chatCompletions(req: ProviderRequest): Promise<ProviderResponse> {
    try {
      const { data, status } = await this.http.post("/chat/completions", req);
      if (status === 200) return data as ProviderResponse;
      throw new ProviderUpstreamError(this.providerName, status);
    } catch (error: any) {
      if (error.name === "ProviderTimeoutError" || error.name === "ProviderUpstreamError" || error.name === "ProviderRateLimitedError" || error.name === "ProviderInvalidRequestError") {
        throw error;
      }
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new ProviderTimeoutError(this.providerName);
      }
      const status = error?.response?.status;
      if (status === 429) throw new ProviderRateLimitedError(this.providerName);
      if (status === 400 || status === 422) {
        const detail = error?.response?.data ? JSON.stringify(error.response.data) : undefined;
        throw new ProviderInvalidRequestError(this.providerName, detail);
      }
      if (status && status >= 500) throw new ProviderUpstreamError(this.providerName, status);
      throw new ProviderUpstreamError(this.providerName, status);
    }
  }
}
