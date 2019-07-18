import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { logout } from './user/user.actions';
import { exhaustMap } from 'rxjs/operators';
import { clearState } from './app.actions';

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
