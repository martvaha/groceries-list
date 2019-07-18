import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, mergeMap, map, concatMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DialogService } from '../../shared/dialog-service/dialog.service';
import { login, logout, loginSuccess, getUser, getUserSuccess } from './user.actions';
import { AuthService } from '../../auth/auth.service';
import { clearState } from '../app.actions';

@Injectable()
export class UserEffects {
  constructor(private actions$: Actions, private auth: AuthService, private dialogService: DialogService) {}

  get$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getUser),
      switchMap(() => this.auth.user.pipe(map(user => getUserSuccess({ user }))))
    )
  );

  login$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(login),
        switchMap(({ redirect }) => this.auth.signInWithFacebook(redirect))
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      switchMap(() => this.auth.signOut().then(() => clearState()))
    )
  );
}
