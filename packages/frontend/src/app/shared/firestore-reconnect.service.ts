import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { Firestore, disableNetwork, enableNetwork } from '@angular/fire/firestore';
import { captureException } from './sentry';

@Injectable({
  providedIn: 'root',
})
export class FirestoreReconnectService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  /**
   * Force the Firestore SDK to tear down and re-establish its transport.
   *
   * When Mobile OS freezes a backgrounded PWA the WebChannel Listen stream can go
   * half-open: writes still succeed (the Write stream reconnects on demand) but
   * realtime updates silently stop until the page is reloaded. Toggling the
   * network re-issues every active listen target over a fresh connection.
   * Queued mutations are kept across the toggle.
   */
  cycleNetwork(): Promise<void> {
    return runInInjectionContext(this.injector, () => disableNetwork(this.firestore))
      .catch((error) => captureException(error))
      .then(() =>
        // Always re-enable, even if disabling failed — never leave the network off
        runInInjectionContext(this.injector, () => enableNetwork(this.firestore)).catch((error) =>
          captureException(error)
        )
      )
      .then(() => undefined);
  }
}
