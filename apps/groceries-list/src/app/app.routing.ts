import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { canActivate, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
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
        // canActivate: [AuthGuard],
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
      },
      { path: 'login', component: AuthComponent },
      // { path: 'list/:listId', component: ListContainerComponent },
      {
        path: 'list',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list/list.module').then((m) => m.ListModule),
      },
      {
        path: 'profile',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./profile/profile.module').then((m) => m.ProfileModule),
      },
      {
        path: 'edit',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list-edit/list-edit.module').then((m) => m.ListEditModule),
      },
      {
        path: 'item',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./item-edit/item-edit.module').then((m) => m.ItemEditModule),
      },
      {
        path: 'share',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list-share/list-share.module').then((m) => m.ListShareModule),
      },
      {
        path: 'invite',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list-invite/list-invite.module').then((m) => m.ListInviteModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
