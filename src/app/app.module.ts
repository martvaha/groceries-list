import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MediaMatcher } from '@angular/cdk/layout';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';

import { environment } from '../environments/environment';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './/app-routing.module';
import { AuthService } from './auth/auth.service';
import { HomeComponent } from './home/home.component';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { SidenavMenuComponent } from './home/sidenav-menu/sidenav-menu.component';
import { AuthComponent } from './auth/auth.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { AuthGuard } from './auth/auth.guard';
import { UserAvatarComponent } from './user/user-avatar/user-avatar.component';
import { ListContainerComponent } from './list-container/list-container.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SidenavMenuComponent,
    AuthComponent,
    ListsContainerComponent,
    UserAvatarComponent,
    ListContainerComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
    BrowserAnimationsModule,
    AppRoutingModule,
    RouterModule,
    SharedModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase, 'groceries-list'),
    AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence()
  ],
  providers: [AuthService, AuthGuard, MediaMatcher],
  bootstrap: [AppComponent]
})
export class AppModule {}
