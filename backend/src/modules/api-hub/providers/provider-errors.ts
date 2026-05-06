export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`PROVIDER_NOT_CONFIGURED: ${provider}`);
    this.name = "ProviderNotConfiguredError";
  }
}

export class ProviderApiKeyMissingError extends Error {
  constructor(provider: string) {
    super(`PROVIDER_API_KEY_MISSING: ${provider}`);
    this.name = "ProviderApiKeyMissingError";
  }
}

export class ProviderTimeoutError extends Error {
  constructor(provider: string) {
    super(`PROVIDER_TIMEOUT: ${provider}`);
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderRateLimitedError extends Error {
  constructor(provider: string) {
    super(`PROVIDER_RATE_LIMITED: ${provider}`);
    this.name = "ProviderRateLimitedError";
  }
}

export class ProviderInvalidRequestError extends Error {
  constructor(provider: string, detail?: string) {
    super(`PROVIDER_INVALID_REQUEST: ${provider}${detail ? ` - ${detail}` : ""}`);
    this.name = "ProviderInvalidRequestError";
  }
}

export class ProviderUpstreamError extends Error {
  constructor(provider: string, statusCode?: number) {
    super(`PROVIDER_ERROR: ${provider}${statusCode ? ` (${statusCode})` : ""}`);
    this.name = "ProviderUpstreamError";
  }
}
