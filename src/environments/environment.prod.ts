import { firebase } from './firebase';

export const environment = {
  production: true,
  debug: false,
  firebase,
  sentry: { dsn: 'https://e0ad91b3a5b944eba7624b3fc20a56d5@sentry.io/1508217' }
};
