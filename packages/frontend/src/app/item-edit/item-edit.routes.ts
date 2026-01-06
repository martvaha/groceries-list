import { Routes } from '@angular/router';
import { ItemEditComponent } from './item-edit.component';

export const ITEM_EDIT_ROUTES: Routes = [
  { path: ':listId/:itemId', component: ItemEditComponent },
];
