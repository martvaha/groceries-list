import { NgModule } from '@angular/core';
import { RouterModule, Routes, Route } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { AuthGuard } from './auth/auth.guard';
import { ListContainerComponent } from './list-container/list-container.component';
import { TestComponent } from './shared/test.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'lists', pathMatch: 'full' },
      { path: 'lists', component: ListsContainerComponent, canActivate: [AuthGuard] },
      { path: 'login', component: AuthComponent },
      { path: 'list/:id', component: ListContainerComponent },
      { path: 'test', component: TestComponent },
      {
        path: 'edit',
        loadChildren: './list-edit/list-edit.module#ListEditModule'
      },
      {
        path: 'item',
        loadChildren: './item-edit/item-edit.module#ItemEditModule'
      },
      {
        path: 'share',
        loadChildren: './list-share/list-share.module#ListShareModule'
      },
      {
        path: 'invite',
        loadChildren: './list-invite/list-invite.module#ListInviteModule'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
