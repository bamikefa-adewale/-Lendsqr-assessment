import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3030', 10),
}));
