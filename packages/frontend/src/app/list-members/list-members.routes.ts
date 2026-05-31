import { Routes } from '@angular/router';
import { ListMembersContainerComponent } from './list-members-container.component';

export const LIST_MEMBERS_ROUTES: Routes = [
  {
    path: ':id',
    component: ListMembersContainerComponent,
  },
];
