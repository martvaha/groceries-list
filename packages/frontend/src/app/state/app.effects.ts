import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { exhaustMap, filter, map, switchMap, take, tap } from 'rxjs/operators';
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
            $localize`Browser does not support background updates. Just reload the page to get the latest version.`,
            $localize`Reload`,
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
              tap((activeListId) =>
                console.log('restoreActiveList$', { activeListId, pathname: document.location.pathname })
              ),
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

export const initAppUpdates$ = createEffect(
  (actions$ = inject(Actions), updates = inject(SwUpdate), snack = inject(MatSnackBar)) =>
    actions$.pipe(
      ofType(initAppEffects),
      switchMap(() =>
        updates.versionUpdates.pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          switchMap(() =>
            snack
              .open($localize`New version available`, $localize`Update`)
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
  initAppUpdates$,
};
