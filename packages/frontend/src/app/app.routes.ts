import { Routes } from '@angular/router';
import { canActivate, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ListsContainerComponent } from './lists-container/lists-container.component';
import { AppShellComponent } from './app-shell/app-shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  // This routes only purpose is to make AppShell more easily testable
  { path: 'shell', component: AppShellComponent },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'lists', pathMatch: 'full' },
      {
        path: 'lists',
        component: ListsContainerComponent,
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
      },
      { path: 'login', component: AuthComponent },
      {
        path: 'list',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list/list.routes').then((m) => m.LIST_ROUTES),
      },
      {
        path: 'profile',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
      {
        path: 'edit',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list-edit/list-edit.routes').then((m) => m.LIST_EDIT_ROUTES),
      },
      {
        path: 'item',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./item-edit/item-edit.routes').then((m) => m.ITEM_EDIT_ROUTES),
      },
      {
        path: 'share',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list-share/list-share.routes').then((m) => m.LIST_SHARE_ROUTES),
      },
      {
        path: 'invite',
        ...canActivate(() => redirectUnauthorizedTo(['home', 'login'])),
        loadChildren: () => import('./list-invite/list-invite.routes').then((m) => m.LIST_INVITE_ROUTES),
      },
      {
        path: 'legal',
        loadChildren: () => import('./legal/legal.routes').then((m) => m.LEGAL_ROUTES),
      },
    ],
  },
];
