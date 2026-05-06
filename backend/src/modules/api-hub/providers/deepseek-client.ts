import { OpenAICompatibleProviderClient } from "./openai-compatible-client";

export class DeepSeekProviderClient extends OpenAICompatibleProviderClient {
  get providerName(): string {
    return "deepseek";
  }
}
