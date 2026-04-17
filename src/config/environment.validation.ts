import * as Joi from 'joi';

export default Joi.object({
  // Application configuration
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3030),

  // Railway MySQL database configuration
  MYSQL_URL: Joi.string().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().required(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().required(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().required(),

  // Karma / Adjutor (onboarding blacklist)
  KARMA_PROVIDER: Joi.string().valid('adjutor').default('adjutor'),
  KARMA_BASE_URL: Joi.string().uri().default('https://adjutor.lendsqr.com'),
  KARMA_APP_ID: Joi.string().required(),
  KARMA_API_KEY: Joi.string().required(),
});
