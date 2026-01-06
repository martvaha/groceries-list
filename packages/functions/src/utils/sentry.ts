import * as Sentry from '@sentry/node';
import { CONFIG } from '../config.js';

function beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
  if (!CONFIG.sentry.enabled) {
    console.error(hint.originalException || hint.syntheticException);
    return null; // this drops the event and nothing will be sent to sentry
  }
  return event;
}

Sentry.init({
  dsn: CONFIG.sentry.dsn,
  beforeSend,
});

export default Sentry;
