import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MediaMatcher } from '@angular/cdk/layout';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';

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
import { ListContainerComponent } from './list-container/list-container.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './state/app.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from './state/app.effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { UserEffects } from './state/user/user.effects';
import { ListEffects } from './state/list/list.effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { GroupEffects } from './state/group/group.effects';
import { ItemEffects } from './state/item/item.effects';
import { sentryInstrumentation } from './shared/sentry';
// import { AppShellComponent } from './app-shell/app-shell.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SidenavMenuComponent,
    ListsContainerComponent,
    UserAvatarComponent,
    ListContainerComponent,
    // AppShellComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'groceries-list' }),
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
    BrowserAnimationsModule,
    AppRoutingModule,
    RouterModule,
    SharedModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase, 'groceries-list'),
    AngularFireAuthModule,
    AngularFirestoreModule,
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true
      }
    }),
    EffectsModule.forRoot([AppEffects, ListEffects, UserEffects, GroupEffects, ItemEffects]),
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }),
    StoreRouterConnectingModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [AuthGuard, MediaMatcher, ...sentryInstrumentation],
  bootstrap: [AppComponent]
})
export class AppModule {}
