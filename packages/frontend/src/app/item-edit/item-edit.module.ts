import { NgModule } from '@angular/core';
import { ItemEditComponent } from './item-edit.component';
import { ItemEditRoutingModule } from './item-edit.routing';
import { ItemEditFormComponent } from './item-edit-form/item-edit-form.component';
import { SharedModule } from '../shared/shared.module';
import { AddCategoryComponent } from './add-category/add-category.component';

@NgModule({
  declarations: [ItemEditComponent, ItemEditFormComponent, AddCategoryComponent],
  imports: [ItemEditRoutingModule, SharedModule]
})
export class ItemEditModule {}
