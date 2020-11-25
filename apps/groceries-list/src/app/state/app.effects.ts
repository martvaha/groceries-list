import { Injectable } from '@angular/core';
import {
  Actions,
  ofType,
  createEffect,
} from '@ngrx/effects';
import { getUser, logout } from './user/user.actions';
import { exhaustMap, map } from 'rxjs/operators';
import { clearState } from './app.actions';
import { of } from 'rxjs';

@Injectable()
export class AppEffects {
  constructor(private actions$: Actions) {}
  clear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      exhaustMap(() => [clearState()])
    )
  );
}
