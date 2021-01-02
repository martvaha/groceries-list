import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { setLanguage } from './config.actions';
import { CookieService } from 'ngx-cookie-service';

const FIREBASE_LANGUAGE_OVERRIDE = 'firebase-language-override';
@Injectable()
export class ConfigEffects {
  constructor(private actions$: Actions, private cookies: CookieService) {}

  setLanguage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(setLanguage),
        map(({ language }) => {
          if (language === 'system') {
            this.cookies.delete(FIREBASE_LANGUAGE_OVERRIDE);
          } else {
            this.cookies.set(FIREBASE_LANGUAGE_OVERRIDE, language);
          }
          document.location.reload();
        })
      ),
    { dispatch: false }
  );
}
