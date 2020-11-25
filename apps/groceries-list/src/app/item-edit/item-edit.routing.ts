import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemEditComponent } from './item-edit.component';

const routes: Routes = [{ path: ':listId/:itemId', component: ItemEditComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemEditRoutingModule {}

export const routedComponents = [ItemEditComponent];
