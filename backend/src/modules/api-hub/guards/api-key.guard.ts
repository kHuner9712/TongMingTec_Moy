import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ApiKeysService } from "../api-keys.service";
import { ApiProjectKey } from "../entities/api-project-key.entity";

export interface ApiKeyRequest extends Request {
  apiKey?: ApiProjectKey;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers["authorization"];

    if (!authHeader) {
      throw new UnauthorizedException({
        error: {
          message: "Missing API key",
          type: "invalid_request_error",
          code: "missing_api_key",
        },
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException({
        error: {
          message: "Invalid authorization header format. Use: Bearer moy_sk_...",
          type: "invalid_request_error",
          code: "invalid_api_key_format",
        },
      });
    }

    if (!token.startsWith("moy_sk_")) {
      throw new UnauthorizedException({
        error: {
          message: "API key must start with moy_sk_",
          type: "invalid_request_error",
          code: "invalid_api_key_format",
        },
      });
    }

    try {
      const apiKey = await this.apiKeysService.validateAndFind(token);
      request.apiKey = apiKey;
      return true;
    } catch (error: any) {
      const message = error?.message || "Invalid API key";

      if (message.includes("EXPIRED")) {
        throw new UnauthorizedException({
          error: {
            message: "API key has expired",
            type: "invalid_request_error",
            code: "api_key_expired",
          },
        });
      }

      if (message.includes("INACTIVE") || message.includes("INVALID")) {
        throw new UnauthorizedException({
          error: {
            message: "Invalid API key",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        });
      }

      throw new UnauthorizedException({
        error: {
          message: "Invalid API key",
          type: "invalid_request_error",
          code: "invalid_api_key",
        },
      });
    }
  }
}
