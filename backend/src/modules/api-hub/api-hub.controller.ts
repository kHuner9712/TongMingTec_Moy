import { Controller, Get } from "@nestjs/common";

@Controller("api/v1/api-hub")
export class ApiHubHealthController {
  @Get("health")
  health() {
    return { status: "ok", service: "moy-api-hub", version: "1.0.0", timestamp: new Date().toISOString() };
  }
}
