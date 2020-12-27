import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { logout } from './user/user.actions';
import { exhaustMap, switchMap, take, tap } from 'rxjs/operators';
import { clearState, restoreActiveList } from './app.actions';
import { Action, Store } from '@ngrx/store';
import { selectActiveListId } from './list/list.reducer';
import { Router } from '@angular/router';
import { State } from './app.reducer';

@Injectable()
export class AppEffects {
  constructor(private actions$: Actions, private store: Store<State>, private router: Router) {}

  clear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      exhaustMap(() => [clearState()])
    )
  );

  restoreActiveList$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(restoreActiveList),
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

  /**
   * getUser effect is run after effect init. This is necessary to
   * bootstrap sync between firebase auth and Store.
   */
  ngrxOnInitEffects(): Action {
    return restoreActiveList();
  }
}
