import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideAnalytics, getAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore, RouterState } from '@ngrx/router-store';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { reducers, metaReducers } from './state/app.reducer';
import { appEffects } from './state/app.effects';
import { configEffects } from './state/config/config.effects';
import { listEffects } from './state/list/list.effects';
import { userEffects } from './state/user/user.effects';
import { groupEffects } from './state/group/group.effects';
import { itemEffects } from './state/item/item.effects';
import { AuthGuard } from './auth/auth.guard';
import { sentryInstrumentation } from './shared/sentry';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // App Check only works in browser - skip during SSR
    ...(typeof document !== 'undefined'
      ? [
          provideAppCheck(() => {
            // Enable debug mode in development - generates a debug token logged to console
            // Register the debug token in Firebase Console > App Check > Manage debug tokens
            if (!environment.production) {
              (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
            }
            return initializeAppCheck(getApp(), {
              provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
              isTokenAutoRefreshEnabled: true,
            });
          }),
        ]
      : []),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideFunctions(() => getFunctions(undefined, 'europe-west1')),
    provideAnalytics(() => getAnalytics()),
    provideStore(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
      },
    }),
    provideEffects(appEffects, configEffects, listEffects, userEffects, groupEffects, itemEffects),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
    }),
    provideRouterStore({
      routerState: RouterState.Minimal,
    }),
    AuthGuard,
    UserTrackingService,
    ScreenTrackingService,
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic',
        appearance: 'outline',
      },
    },
    ...sentryInstrumentation, provideClientHydration(withEventReplay()),
  ],
};
