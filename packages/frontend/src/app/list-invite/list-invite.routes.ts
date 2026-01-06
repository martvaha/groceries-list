import { Routes } from '@angular/router';
import { ListInviteContainerComponent } from './list-invite-container.component';

export const LIST_INVITE_ROUTES: Routes = [
  { path: ':id', component: ListInviteContainerComponent },
];
