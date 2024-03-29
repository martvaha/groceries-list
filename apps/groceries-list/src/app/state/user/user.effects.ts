import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { clearState } from '../app.actions';
import { getUser, getUserSuccess, login, logout } from './user.actions';

@Injectable()
export class UserEffects implements OnInitEffects {
  constructor(private actions$: Actions, private auth: AuthService) {}

  get$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getUser),
      switchMap(() =>
        this.auth.getUser().pipe(
          filter((user) => user !== undefined),
          map((user) => getUserSuccess({ user }))
        )
      )
    )
  );

  login$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(login),
        switchMap(({ provider, redirect }) => this.auth.signInWithProvider(provider, redirect))
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        switchMap(() => this.auth.signOut(['/home/login']))
      ),
    { dispatch: false }
  );

  /**
   * getUser effect is run after effect init. This is necessary to
   * bootstrap sync between firebase auth and Store.
   */
  ngrxOnInitEffects(): Action {
    return getUser();
  }
}
