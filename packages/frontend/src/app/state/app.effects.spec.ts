import { Actions } from '@ngrx/effects';
import { of } from 'rxjs';
import { FirestoreReconnectService } from '../shared/firestore-reconnect.service';
import { initAppEffects } from './app.actions';
import { reconnectOnResume$ } from './app.effects';

describe('reconnectOnResume$', () => {
  let reconnect: jasmine.SpyObj<FirestoreReconnectService>;

  beforeEach(() => {
    reconnect = jasmine.createSpyObj<FirestoreReconnectService>('FirestoreReconnectService', ['cycleNetwork']);
    reconnect.cycleNetwork.and.returnValue(Promise.resolve());
  });

  it('cycles the Firestore network when the browser comes back online', () => {
    const actions$ = of(initAppEffects()) as Actions;
    const subscription = reconnectOnResume$(actions$, reconnect, 'browser').subscribe();

    window.dispatchEvent(new Event('online'));

    expect(reconnect.cycleNetwork).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });

  it('throttles bursts of resume events into a single cycle', () => {
    const actions$ = of(initAppEffects()) as Actions;
    const subscription = reconnectOnResume$(actions$, reconnect, 'browser').subscribe();

    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));

    expect(reconnect.cycleNetwork).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });

  it('does nothing on the server platform', () => {
    const actions$ = of(initAppEffects()) as Actions;
    let completed = false;
    reconnectOnResume$(actions$, reconnect, 'server').subscribe({ complete: () => (completed = true) });

    expect(completed).toBeTrue();
    expect(reconnect.cycleNetwork).not.toHaveBeenCalled();
  });
});
