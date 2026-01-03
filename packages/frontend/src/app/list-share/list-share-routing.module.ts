import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListShareComponent } from './list-share.component';

const routes: Routes = [
  // { path: '', pathMatch: 'full', redirectTo: 'share' },
  { path: ':id', component: ListShareComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ListShareRoutingModule {}

export const routedComponents = [ListShareComponent];
