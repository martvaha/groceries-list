import { NgModule } from '@angular/core';
import { ItemEditComponent } from './item-edit.component';
import { ItemEditRoutingModule } from './item-edit.routing';
import { ItemEditFormComponent } from './item-edit-form/item-edit-form.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ItemEditComponent, ItemEditFormComponent],
  imports: [ItemEditRoutingModule, SharedModule]
})
export class ItemEditModule {}
