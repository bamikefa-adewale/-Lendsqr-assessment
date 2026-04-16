import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { appCreate } from 'app.create';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  dotenv.config({ path: '.env' });
  dotenv.config({ path: `.env.${nodeEnv}`, override: true });

  const logger = new Logger('bootstrap');
  logger.log(`NODE_ENV: ${process.env.NODE_ENV ?? 'not set'}`);
  logger.log(`PORT: ${process.env.PORT ?? '1010'}`);

  const app = await NestFactory.create(AppModule);

  // APP MIDDLEWARES for Global pipes, interceptors, Swagger and git CORS
  appCreate(app);

  // Register global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 1010);
  logger.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 1010}/api/v1`,
  );
}
bootstrap();
