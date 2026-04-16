import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';

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
  const liveServerUrl = process.env.SWAGGER_LIVE_SERVER_URL;

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
    .addServer(liveServerUrl ?? 'https://api.yourdomain.com/api/v1', 'Live Production Server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('api', app, document);

  app.enableCors();
}
