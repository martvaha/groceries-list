import { inject } from '@angular/core';
import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { filter, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { getUser, getUserSuccess, login, logout } from './user.actions';

/**
 * getUser effect is run after effect init. This is necessary to
 * bootstrap sync between firebase auth and Store.
 */
export const initUser$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => getUser())
    ),
  { functional: true }
);

export const get$ = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(getUser),
      switchMap(() =>
        auth.getUser().pipe(
          filter((user) => user !== undefined),
          map((user) => getUserSuccess({ user }))
        )
      )
    ),
  { functional: true }
);

export const loginEffect$ = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(login),
      switchMap(({ provider, redirect }) => auth.signInWithProvider(provider, redirect))
    ),
  { functional: true, dispatch: false }
);

export const logoutEffect$ = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(logout),
      switchMap(() => auth.signOut(['/home/login']))
    ),
  { functional: true, dispatch: false }
);

export const userEffects = {
  initUser$,
  get$,
  loginEffect$,
  logoutEffect$,
};
