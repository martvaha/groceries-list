import { ListContainerComponent } from './list-container/list-container.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListRoutingModule } from './list-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ListContainerComponent],
  imports: [CommonModule, ListRoutingModule, SharedModule],
})
export class ListModule {}
