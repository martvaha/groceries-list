import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { setLanguage } from './config.actions';
import { DOCUMENT } from '@angular/common';

const LANGUAGES = new Set(['en', 'et']);
@Injectable()
export class ConfigEffects {
  constructor(private actions$: Actions, @Inject(DOCUMENT) private document: Document) {}

  setLanguage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(setLanguage),
        map(({ language }) => {
          const pathname = this.document.location.pathname.split('/').slice(1);
          let currentLanguage: string | null = pathname[0];
          if (!LANGUAGES.has(currentLanguage)) currentLanguage = null;
          language = language === 'system' ? 'en' : language;
          const urlBase = this.document.location.href.split('/').slice(0, 3).join('/');
          const urlPath = ['', language, ...(currentLanguage ? pathname.slice(1) : pathname)].join('/');
          console.log('9230', urlBase, urlPath);
          this.document.location.href = urlBase + urlPath;
        })
      ),
    { dispatch: false }
  );
}
