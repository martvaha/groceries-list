import * as Sentry from "@sentry/node";
import { CONFIG } from "../const";
import { EventHint, Event } from "@sentry/types";

function beforeSend(event: Event, hint: EventHint) {
  if (!CONFIG.sentry.enabled) {
    console.error(hint.originalException || hint.syntheticException);
    return null; // this drops the event and nothing will be sent to sentry
  }
  return event;
}

Sentry.init({
  dsn: CONFIG.sentry.dsn,
  beforeSend
});

export default Sentry;
