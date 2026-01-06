import { Routes } from '@angular/router';
import { ListEditComponent } from './list-edit.component';

export const LIST_EDIT_ROUTES: Routes = [
  { path: ':listId', component: ListEditComponent },
];
