import { NgModule } from '@angular/core';

import { ListShareComponent } from './list-share.component';
import { ListShareRoutingModule } from './list-share-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MatChipsModule } from '@angular/material';

@NgModule({
  imports: [ListShareRoutingModule, SharedModule, MatChipsModule],
  exports: [],
  declarations: [ListShareComponent],
  providers: []
})
export class ListShareModule {}
