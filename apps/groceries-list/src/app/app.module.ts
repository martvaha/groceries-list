import { MediaMatcher } from '@angular/cdk/layout';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAnalyticsModule, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { EffectsModule } from '@ngrx/effects';
import { RouterState, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { AppShellModule } from './app-shell/app-shell.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';
import { AuthGuard } from './auth/auth.guard';
import { HomeComponent } from './home/home.component';
import { SidenavMenuComponent } from './home/sidenav-menu/sidenav-menu.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { sentryInstrumentation } from './shared/sentry';
import { SharedModule } from './shared/shared.module';
import { AppEffects } from './state/app.effects';
import { metaReducers, reducers } from './state/app.reducer';
import { ConfigEffects } from './state/config/config.effects';
import { GroupEffects } from './state/group/group.effects';
import { ItemEffects } from './state/item/item.effects';
import { ListEffects } from './state/list/list.effects';
import { UserEffects } from './state/user/user.effects';
import { UserAvatarComponent } from './user/user-avatar/user-avatar.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, SidenavMenuComponent, ListsContainerComponent, UserAvatarComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'groceries-list' }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    BrowserAnimationsModule,
    AppRoutingModule,
    AppShellModule,
    RouterModule,
    SharedModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase, 'groceries-list'),
    AngularFireAnalyticsModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
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
    }),
    StoreRouterConnectingModule.forRoot({
      routerState: RouterState.Minimal,
    }),
    HammerModule,
  ],
  providers: [
    AuthGuard,
    MediaMatcher,
    UserTrackingService,
    ScreenTrackingService,
    ...sentryInstrumentation,
    // { provide: HAMMER_GESTURE_CONFIG, useClass: GestureConfig },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
