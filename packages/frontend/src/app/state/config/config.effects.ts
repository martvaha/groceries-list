import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { setLanguage } from './config.actions';
import { DOCUMENT } from '@angular/common';

const LANGUAGES = new Set(['en', 'et']);

export const setLanguage$ = createEffect(
  (actions$ = inject(Actions), document = inject<Document>(DOCUMENT)) =>
    actions$.pipe(
      ofType(setLanguage),
      map(({ language }) => {
        const pathname = document.location.pathname.split('/').slice(1);
        let currentLanguage: string | null = pathname[0];
        if (!LANGUAGES.has(currentLanguage)) currentLanguage = null;
        language = language === 'system' ? 'en' : language;
        const urlBase = document.location.href.split('/').slice(0, 3).join('/');
        const urlPath = ['', language, ...(currentLanguage ? pathname.slice(1) : pathname)].join('/');
        console.log('9230', urlBase, urlPath);
        document.location.href = urlBase + urlPath;
      })
    ),
  { functional: true, dispatch: false }
);

export const configEffects = {
  setLanguage$,
};
