import { Routes } from '@angular/router';
import { ListShareComponent } from './list-share.component';

export const LIST_SHARE_ROUTES: Routes = [
  { path: ':id', component: ListShareComponent },
];
