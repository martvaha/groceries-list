import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { NgModule, isDevMode } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MediaMatcher } from '@angular/cdk/layout';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAnalytics, getAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';

import { environment } from '../environments/environment';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app.routing';
import { HomeComponent } from './home/home.component';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { SidenavMenuComponent } from './home/sidenav-menu/sidenav-menu.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { AuthGuard } from './auth/auth.guard';
import { UserAvatarComponent } from './user/user-avatar/user-avatar.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './state/app.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from './state/app.effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { UserEffects } from './state/user/user.effects';
import { ListEffects } from './state/list/list.effects';
import { StoreRouterConnectingModule, RouterState } from '@ngrx/router-store';
import { GroupEffects } from './state/group/group.effects';
import { ItemEffects } from './state/item/item.effects';
import { sentryInstrumentation } from './shared/sentry';
import { ConfigEffects } from './state/config/config.effects';
import { AppShellModule } from './app-shell/app-shell.module';

@NgModule({
  declarations: [AppComponent, HomeComponent, SidenavMenuComponent, ListsContainerComponent, UserAvatarComponent],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
    BrowserAnimationsModule,
    AppRoutingModule,
    AppShellModule,
    RouterModule,
    SharedModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
      },
    }),
    EffectsModule.forRoot([AppEffects, ConfigEffects, ListEffects, UserEffects, GroupEffects, ItemEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true
    }),
    StoreRouterConnectingModule.forRoot({
      routerState: RouterState.Minimal,
    }),
    HammerModule,
  ],
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideAnalytics(() => getAnalytics()),
    AuthGuard,
    MediaMatcher,
    UserTrackingService,
    ScreenTrackingService,
    ...sentryInstrumentation,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
