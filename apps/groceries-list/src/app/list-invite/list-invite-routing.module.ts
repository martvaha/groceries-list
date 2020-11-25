import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListInviteContainerComponent } from './list-invite-container.component';

const routes: Routes = [
  // { path: '', pathMatch: 'full', redirectTo: 'share' },
  { path: ':id', component: ListInviteContainerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ListInviteRoutingModule {}

export const routedComponents = [ListInviteRoutingModule];
