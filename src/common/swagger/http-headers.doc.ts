/** Reusable OpenAPI header definitions (match `src/https/*.http` examples). */

export const authorizationBearerHeader = {
  name: 'Authorization',
  required: true,
  description: 'Bearer access token (JWT)',
  schema: {
    type: 'string',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
} as const;

export const contentTypeJsonHeader = {
  name: 'Content-Type',
  required: true,
  description: 'JSON request body',
  schema: {
    type: 'string',
    example: 'application/json',
  },
} as const;

export function idempotencyKeyHeader(example: string) {
  return {
    name: 'Idempotency-Key',
    required: true,
    description:
      'Unique key per mutation request. Reuse the same key to safely retry without duplicate processing.',
    schema: {
      type: 'string',
      example,
    },
  } as const;
}
