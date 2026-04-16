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
  KARMA_PROVIDER: Joi.string().valid('mock', 'adjutor').default('mock'),
  KARMA_MOCK_BLACKLISTED_EMAILS: Joi.string().allow('').optional(),
  ADJUTOR_API_URL: Joi.when('KARMA_PROVIDER', {
    is: 'adjutor',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().allow('').optional(),
  }),
  ADJUTOR_API_KEY: Joi.when('KARMA_PROVIDER', {
    is: 'adjutor',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').optional(),
  }),
});
