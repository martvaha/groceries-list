import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { Routes, RouterModule } from '@angular/router';
import { AppShellComponent } from './app-shell/app-shell.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const routes: Routes = [ { path: 'shell', component: AppShellComponent }];

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule.forRoot(routes)
  ],
  bootstrap: [AppComponent],
  declarations: [AppShellComponent]
})
export class AppServerModule {}
