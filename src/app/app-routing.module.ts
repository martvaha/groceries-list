import { NgModule } from '@angular/core';
import { RouterModule, Routes, Route } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { AuthGuard } from './auth/auth.guard';
import { AppShellComponent } from './app-shell/app-shell.component';
import { environment } from '../environments/environment.prod';
import { ListContainerComponent } from './list-container/list-container.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'lists', pathMatch: 'full' },
      { path: 'lists', component: ListsContainerComponent, canActivate: [AuthGuard] },
      { path: 'login', component: AuthComponent },
      { path: 'list/:id', component: ListContainerComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
