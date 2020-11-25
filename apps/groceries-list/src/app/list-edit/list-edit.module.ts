import { NgModule } from '@angular/core';

import { ListEditComponent } from './list-edit.component';
import { ListEditRoutingModule } from './list-edit-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [ListEditRoutingModule, SharedModule],
  exports: [],
  declarations: [ListEditComponent],
  providers: []
})
export class ListEditModule {}
