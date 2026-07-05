import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, from, fromEvent, merge } from 'rxjs';
import { exhaustMap, filter, map, switchMap, take, tap, throttleTime } from 'rxjs/operators';
import { FirestoreReconnectService } from '../shared/firestore-reconnect.service';
import { checkForUpdate, clearState, initAppEffects } from './app.actions';
import { State } from './app.reducer';
import { selectActiveListId } from './list/list.reducer';
import { logout } from './user/user.actions';

export const initApp$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => initAppEffects())
    ),
  { functional: true }
);

export const clear$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(logout),
      exhaustMap(() => [clearState()])
    ),
  { functional: true }
);

export const checkForUpdates$ = createEffect(
  (actions$ = inject(Actions), updates = inject(SwUpdate), snack = inject(MatSnackBar)) =>
    actions$.pipe(
      ofType(checkForUpdate),
      map(() => {
        if (!updates.isEnabled) {
          const snackRef = snack.open(
            $localize`:@@update.unsupported:Browser does not support background updates. Just reload the page to get the latest version.`,
            $localize`:@@update.reload:Reload`,
            { duration: 5000 }
          );
          snackRef.afterDismissed().subscribe(({ dismissedByAction }) => {
            if (dismissedByAction) document.location.reload();
          });
        } else {
          updates.checkForUpdate();
        }
      })
    ),
  { functional: true, dispatch: false }
);

// Restores activeList if active ID is present in localstore and path is root ("/")
// This is used to restore previously active list after PWA is closed and reopened.
export const restoreActiveList$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject<Store<State>>(Store),
    router = inject(Router),
    platformId = inject(PLATFORM_ID)
  ) =>
    isPlatformServer(platformId)
      ? EMPTY
      : actions$.pipe(
          ofType(initAppEffects),
          switchMap(() =>
            store.select(selectActiveListId).pipe(
              take(1),
              tap(
                (activeListId) =>
                  activeListId &&
                  document.location.pathname === '/' &&
                  router.navigate(['home', 'list', activeListId])
              )
            )
          )
        ),
  { functional: true, dispatch: false }
);

// Mobile OS freezes backgrounded PWAs, which can leave the Firestore Listen
// stream half-open: writes still succeed but realtime updates silently stop
// until reload. Cycle the Firestore network whenever the app comes back to the
// foreground (or the browser regains connectivity) to force a reconnect.
export const reconnectOnResume$ = createEffect(
  (
    actions$ = inject(Actions),
    reconnect = inject(FirestoreReconnectService),
    platformId = inject(PLATFORM_ID)
  ) =>
    isPlatformServer(platformId)
      ? EMPTY
      : actions$.pipe(
          ofType(initAppEffects),
          switchMap(() =>
            merge(
              fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible')),
              fromEvent(window, 'online')
            )
          ),
          // Leading throttle: reconnect immediately on resume, ignore the burst
          // that follows (visibilitychange + online often fire together).
          throttleTime(3000),
          // Never overlap toggle cycles
          exhaustMap(() => from(reconnect.cycleNetwork()))
        ),
  { functional: true, dispatch: false }
);

export const initAppUpdates$ = createEffect(
  (actions$ = inject(Actions), updates = inject(SwUpdate), snack = inject(MatSnackBar)) =>
    actions$.pipe(
      ofType(initAppEffects),
      switchMap(() =>
        updates.versionUpdates.pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          switchMap(() =>
            snack
              .open($localize`:@@update.available:New version available`, $localize`:@@update.action:Update`)
              .afterDismissed()
              .pipe(tap(() => updates.activateUpdate().then(() => document.location.reload())))
          )
        )
      )
    ),
  { functional: true, dispatch: false }
);

export const appEffects = {
  initApp$,
  clear$,
  checkForUpdates$,
  restoreActiveList$,
  reconnectOnResume$,
  initAppUpdates$,
};
