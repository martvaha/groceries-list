import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeleteDataComponent } from './delete-data/delete-data.component';
import { LegalRoutingModule } from './legal.router';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

@NgModule({
  declarations: [DeleteDataComponent, PrivacyPolicyComponent],
  imports: [CommonModule, LegalRoutingModule],
})
export class LegalModule {}
