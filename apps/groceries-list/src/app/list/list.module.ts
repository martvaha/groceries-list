import { ListContainerComponent } from './list-container/list-container.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListRoutingModule } from './list-routing.module';
import { SharedModule } from '../shared/shared.module';
import { AngularFireModule } from '@angular/fire';

@NgModule({
  declarations: [ListContainerComponent],
  imports: [CommonModule, ListRoutingModule, SharedModule, AngularFireModule],
})
export class ListModule {}
