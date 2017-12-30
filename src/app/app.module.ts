import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './/app-routing.module';

import { environment } from '../environments/environment';
import { HomeComponent } from './home/home.component';
import { RouterModule } from '@angular/router';
// import { AppShellComponent } from './app-shell/app-shell.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    // AppShellComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production}),
    NoopAnimationsModule,
    AppRoutingModule,
    RouterModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
