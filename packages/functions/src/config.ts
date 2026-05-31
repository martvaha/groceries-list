import { z } from 'zod';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const APP_ROOT = __dirname;

// Zod schema for all environment variables
const envSchema = z.object({
  // SMTP settings
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),

  // Sentry
  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_ENABLED: z.enum(['true', 'false']).default('false'),

  // Email settings
  EMAIL_ENABLED: z.enum(['true', 'false']).default('true'),
  EMAIL_TEST_RECIPIENT: z.string().optional().default(''),

  // App
  APP_DOMAIN: z.url().default('https://groceries-list.com'),

  // Comma-separated list of admin user UIDs allowed to run privileged callables (e.g. migrateProfiles)
  ADMIN_UIDS: z.string().optional().default(''),

  // Node
  NODE_ENV: z.string().optional(),
});

// Lazy-load and cache validated env to avoid failing during Firebase's analysis phase
let cachedEnv: z.infer<typeof envSchema> | null = null;

function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }
  return cachedEnv;
}

export function getConfig() {
  const env = getEnv();
  return {
    smtp: {
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    },
    sentry: {
      enabled: env.SENTRY_ENABLED === 'true',
      dsn: env.SENTRY_DSN,
    },
    sendEmail: env.EMAIL_ENABLED !== 'false',
    sendEmailTo: env.EMAIL_TEST_RECIPIENT ? [env.EMAIL_TEST_RECIPIENT] : [],
    disableTemplateCache: env.NODE_ENV !== 'production',
    baseDomain: env.APP_DOMAIN,
    adminUids: env.ADMIN_UIDS.split(',')
      .map((uid) => uid.trim())
      .filter(Boolean),
  };
}
