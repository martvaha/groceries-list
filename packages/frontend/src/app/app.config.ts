import { ApplicationConfig, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAnalytics, getAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore, routerReducer, RouterState } from '@ngrx/router-store';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { reducers, metaReducers } from './state/app.reducer';
import { AppEffects } from './state/app.effects';
import { ConfigEffects } from './state/config/config.effects';
import { ListEffects } from './state/list/list.effects';
import { UserEffects } from './state/user/user.effects';
import { GroupEffects } from './state/group/group.effects';
import { ItemEffects } from './state/item/item.effects';
import { AuthGuard } from './auth/auth.guard';
import { sentryInstrumentation } from './shared/sentry';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

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
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideAnalytics(() => getAnalytics()),
    provideStore(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
      },
    }),
    provideEffects([AppEffects, ConfigEffects, ListEffects, UserEffects, GroupEffects, ItemEffects]),
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
    ...sentryInstrumentation, provideClientHydration(withEventReplay()),
  ],
};
