import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
// import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MediaMatcher } from '@angular/cdk/layout';

import { environment } from '../environments/environment';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './/app-routing.module';
import { AuthService } from './auth/auth.service';
import { HomeComponent } from './home/home.component';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { SidenavMenuComponent } from './home/sidenav-menu/sidenav-menu.component';
import { AuthComponent } from './auth/auth.component';
import { ListContainerComponent } from './list-container/list-container.component';
import { AuthGuard } from './auth/auth.guard';
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SidenavMenuComponent,
    AuthComponent,
    ListContainerComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    // ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production}),
    BrowserAnimationsModule,
    AppRoutingModule,
    RouterModule,
    SharedModule,
    HttpClientModule,
  ],
  providers: [AuthService, AuthGuard, MediaMatcher],
  bootstrap: [AppComponent]
})
export class AppModule { }
