import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// This function sets up the global validation pipe, serialization interceptor, and Swagger documentation for the NestJS application.
// It ensures that incoming requests are validated, responses are serialized correctly, and provides a user-friendly

export function appCreate(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global response serialization (e.g. for @Exclude/@Expose)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger setup
  const localServerUrl = process.env.SWAGGER_LOCAL_SERVER_URL ?? 'http://localhost:1010/api/v1';
  const globalApiPrefix = process.env.GLOBAL_API_PREFIX ?? 'api/v1';

  const config = new DocumentBuilder()
    .setTitle('Lending SQL API')
    .setDescription(
      'API documentation for the Lending SQL application httpl://localhost:1010',
    )
    .setVersion('1.0')
    .addTag('Lending SQL')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'Paste JWT token only (without "Bearer ").',
      },
      'bearer',
    )
    .addServer(localServerUrl, 'Local Development Server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });
  const swaggerCustomOptions: SwaggerCustomOptions = {
    patchDocumentOnRequest: (req, _res, doc: OpenAPIObject) => {
      const request = req as {
        headers?: Record<string, string | string[] | undefined>;
        protocol?: string;
        get?: (name: string) => string | undefined;
      };
      const forwardedProtoHeader = request.headers?.['x-forwarded-proto'];
      const forwardedHostHeader = request.headers?.['x-forwarded-host'];

      const proto = Array.isArray(forwardedProtoHeader)
        ? forwardedProtoHeader[0]
        : forwardedProtoHeader ?? request.protocol ?? 'http';
      const host = Array.isArray(forwardedHostHeader)
        ? forwardedHostHeader[0]
        : forwardedHostHeader ?? request.get?.('host') ?? 'localhost:1010';

      const normalizedPrefix = globalApiPrefix.replace(/^\/+|\/+$/g, '');
      const liveServerUrl = `${proto}://${host}/${normalizedPrefix}`;

      return {
        ...doc,
        servers: [
          { url: localServerUrl, description: 'Local Development Server' },
          { url: liveServerUrl, description: 'Live Production Server' },
        ],
      };
    },
  };

  SwaggerModule.setup('api', app, document, swaggerCustomOptions);

  app.enableCors();
}
