import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListEditComponent } from './list-edit.component';

const routes: Routes = [
  // { path: '', pathMatch: 'full', redirectTo: 'share' },
  { path: ':id', component: ListEditComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ListEditRoutingModule {}

export const routedComponents = [ListEditComponent];
