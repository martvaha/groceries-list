import { NgModule } from '@angular/core';
import { RouterModule, Routes, Route } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { AuthGuard } from './auth/auth.guard';
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
      { path: 'list/:listId', component: ListContainerComponent },
      {
        path: 'edit',
        loadChildren: () => import('./list-edit/list-edit.module').then(m => m.ListEditModule)
      },
      {
        path: 'item',
        loadChildren: () => import('./item-edit/item-edit.module').then(m => m.ItemEditModule)
      },
      {
        path: 'share',
        loadChildren: () => import('./list-share/list-share.module').then(m => m.ListShareModule)
      },
      {
        path: 'invite',
        loadChildren: () => import('./list-invite/list-invite.module').then(m => m.ListInviteModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
