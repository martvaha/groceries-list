import { join } from 'path';

export const APP_ROOT = join(__dirname, '..');
export const CONFIG = {
  smtpConfig: {
    host: '',
    port: 587,
    auth: {
      user: '',
      pass: '',
    },
  },
  sentry: {
    enabled: false,
    dsn: '',
  },
  sendEmail: false,
  sendEmailTo: [],
  disableTemplateCache: true,
};

