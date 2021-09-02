import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { exhaustMap, map, switchMap, take, tap } from 'rxjs/operators';
import { checkForUpdate, clearState, initAppEffects } from './app.actions';
import { State } from './app.reducer';
import { selectActiveListId } from './list/list.reducer';
import { logout } from './user/user.actions';

@Injectable()
export class AppEffects {
  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private router: Router,
    private updates: SwUpdate,
    private snack: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  clear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      exhaustMap(() => [clearState()])
    )
  );

  checkForUpdates$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(checkForUpdate),
        map(() => {
          if (!this.updates.isEnabled) {
            const snackRef = this.snack.open(
              $localize`Browser does not support background updates. Just reload the page to get the latest version.`,
              $localize`Reload`,
              { duration: 5000 }
            );
            snackRef.afterDismissed().subscribe(({ dismissedByAction }) => {
              if (dismissedByAction) document.location.reload();
            });
          } else {
            this.updates.checkForUpdate();
          }
        })
      ),
    { dispatch: false }
  );

  // Restores activeList if active ID is present in localstore and path is root ("/")
  // This is used to restore previously active list after PWA is closed and reopened.
  restoreActiveList$ = createEffect(
    () =>
      isPlatformServer(this.platformId)
        ? EMPTY
        : this.actions$.pipe(
            ofType(initAppEffects),
            switchMap(() =>
              this.store.select(selectActiveListId).pipe(
                take(1),
                tap((activeListId) =>
                  console.log('restoreActiveList$', { activeListId, pathname: document.location.pathname })
                ),
                tap(
                  (activeListId) =>
                    activeListId &&
                    document.location.pathname === '/' &&
                    this.router.navigate(['home', 'list', activeListId])
                )
              )
            )
          ),
    { dispatch: false }
  );

  initAppUpdates$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(initAppEffects),
        switchMap(() =>
          this.updates.available.pipe(
            switchMap(() =>
              this.snack
                .open($localize`New version available`, $localize`Update`)
                .afterDismissed()
                .pipe(tap(() => this.updates.activateUpdate().then(() => document.location.reload())))
            )
          )
        )
      ),
    { dispatch: false }
  );

  ngrxOnInitEffects(): Action {
    return initAppEffects();
  }

  private shouldRestoreActiveList(pathname: string) {
    return pathname === '/';
  }
}
