import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { logout } from './user/user.actions';
import { exhaustMap, switchMap, take, tap } from 'rxjs/operators';
import { clearState, initAppEffects } from './app.actions';
import { Action, Store } from '@ngrx/store';
import { selectActiveListId } from './list/list.reducer';
import { Router } from '@angular/router';
import { State } from './app.reducer';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AppEffects {
  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private router: Router,
    private updates: SwUpdate,
    private snack: MatSnackBar
  ) {}

  clear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      exhaustMap(() => [clearState()])
    )
  );

  restoreActiveList$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(initAppEffects),
        switchMap(() =>
          this.store.select(selectActiveListId).pipe(
            take(1),
            tap((activeListId) => console.log(activeListId)),
            tap((activeListId) => activeListId && this.router.navigate(['home', 'list', activeListId]))
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
                .open('New version available', 'Update')
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
}
