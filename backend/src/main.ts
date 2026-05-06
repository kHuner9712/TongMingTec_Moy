import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { StateMachineErrorFilter } from "./common/filters/state-machine-error.filter";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

interface ValidationIssue {
  field: string;
  messages: string[];
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = "",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const error of errors) {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const messages = error.constraints ? Object.values(error.constraints) : [];

    if (messages.length > 0) {
      issues.push({ field, messages });
    }

    if (error.children && error.children.length > 0) {
      issues.push(...flattenValidationErrors(error.children, field));
    }
  }

  return issues;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5176",
  ];

  app.setGlobalPrefix("api/v1", {
    exclude: ["v1/(.*)", "api/geo/(.*)"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const validationErrors = flattenValidationErrors(errors);
        return new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "PARAM_INVALID",
          details: { validationErrors },
        });
      },
    }),
  );

  app.useGlobalFilters(
    new StateMachineErrorFilter(),
    new AllExceptionsFilter(),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Org-Id",
      "X-Request-Id",
    ],
    exposedHeaders: ["X-Request-Id"],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("MOY App OpenAPI")
    .setDescription(
      "MOY App enterprise AI-native customer operating system API documentation",
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup("docs", app, swaggerDocument, {
    useGlobalPrefix: true,
    swaggerOptions: {
      tagsSorter: "alpha",
      operationsSorter: "alpha",
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MOY App Backend running on port ${port}, docs: /api/v1/docs`);
}

bootstrap();
