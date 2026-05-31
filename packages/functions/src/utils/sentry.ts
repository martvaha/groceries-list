import * as Sentry from '@sentry/node';
import { getConfig } from '../config.js';

let initialized = false;

function initSentry() {
  if (initialized) return;

  const config = getConfig();

  Sentry.init({
    dsn: config.sentry.dsn,
    beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
      if (!config.sentry.enabled) {
        console.error(hint.originalException || hint.syntheticException);
        return null; // this drops the event and nothing will be sent to sentry
      }
      return event;
    },
  });

  initialized = true;
}

// Wrapper that ensures Sentry is initialized before use
const SentryWrapper = {
  captureException(exception: unknown) {
    initSentry();
    return Sentry.captureException(exception);
  },
  captureMessage(message: string) {
    initSentry();
    return Sentry.captureMessage(message);
  },
};

export default SentryWrapper;
