import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeleteDataComponent } from './delete-data/delete-data.component';
import { LegalRoutingModule } from './legal.router';

@NgModule({
  declarations: [DeleteDataComponent],
  imports: [CommonModule, LegalRoutingModule],
})
export class LegalModule {}
