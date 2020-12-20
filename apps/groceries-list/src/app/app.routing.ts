import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { AuthGuard } from './auth/auth.guard';
// import { AppShellComponent } from './app-shell/app-shell.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  // { path: 'shell', component: AppShellComponent },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'lists', pathMatch: 'full' },
      {
        path: 'lists',
        component: ListsContainerComponent,
        canActivate: [AuthGuard],
      },
      { path: 'login', component: AuthComponent },
      // { path: 'list/:listId', component: ListContainerComponent },
      {
        path: 'list',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./list/list.module').then((m) => m.ListModule),
      },
      {
        path: 'edit',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./list-edit/list-edit.module').then((m) => m.ListEditModule),
      },
      {
        path: 'item',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./item-edit/item-edit.module').then((m) => m.ItemEditModule),
      },
      {
        path: 'share',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./list-share/list-share.module').then(
            (m) => m.ListShareModule
          ),
      },
      {
        path: 'invite',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./list-invite/list-invite.module').then(
            (m) => m.ListInviteModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
