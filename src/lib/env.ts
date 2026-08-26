import { z } from 'zod';

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // Auth
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, 'NEXTAUTH_SECRET must be at least 16 characters in dev (32 in prod)')
    .default('gymflow-dev-secret-at-least-32-chars-key-abc123'),
  AUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI & External APIs (Server-side)
  OPENAI_API_KEY: z.string().optional(),
  EXERCISE_API_KEY: z.string().optional(),

  // Push notifications
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Upstash Redis (Optional)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Public App URL
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates and exposes environment variables with strict runtime type-checking.
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Format error messages clearly
    const formattedErrors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    // In testing or build environments without DB, fallback gracefully with defaults if needed
    if (process.env.NODE_ENV === 'test') {
      return {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/gymflow_test',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'gymflow-test-secret-at-least-32-chars-key-abc123',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      } as Env;
    }

    // eslint-disable-next-line no-console
    console.error(`❌ Invalid environment variables:\n${formattedErrors}`);
    throw new Error(`Invalid environment variables:\n${formattedErrors}`);
  }

  return parsed.data;
}

export const env = validateEnv();
