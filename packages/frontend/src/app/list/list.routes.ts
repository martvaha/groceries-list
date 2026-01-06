import { Routes } from '@angular/router';
import { ListContainerComponent } from './list-container/list-container.component';

export const LIST_ROUTES: Routes = [
  { path: ':listId', component: ListContainerComponent },
];
