import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const APP_ROOT = __dirname;

// Load runtime config from file or environment
function loadRuntimeConfig() {
  const configPath = join(__dirname, '..', '.runtimeconfig.json');
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

const runtimeConfig = loadRuntimeConfig();

export const CONFIG = {
  smtpConfig: runtimeConfig.smtpConfig || {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  sentry: {
    enabled: runtimeConfig.sentry?.enabled === true || process.env.SENTRY_ENABLED === 'true',
    dsn: runtimeConfig.sentry?.dsn || process.env.SENTRY_DSN || '',
  },
  sendEmail: runtimeConfig.email?.enabled !== false,
  sendEmailTo: runtimeConfig.email?.testRecipient ? [runtimeConfig.email.testRecipient] : [],
  disableTemplateCache: process.env.NODE_ENV !== 'production',
  baseDomain: runtimeConfig.app?.domain || process.env.APP_DOMAIN || 'https://groceries-list.com',
};
