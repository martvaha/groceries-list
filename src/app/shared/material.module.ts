import { NgModule } from '@angular/core';

import { MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule, MatToolbarModule } from '@angular/material';

const modules = [
  MatButtonModule,
  MatCheckboxModule,
  MatProgressSpinnerModule,
  MatToolbarModule
];

@NgModule({
  imports: modules,
  exports: modules,
  declarations: [],
  providers: [],
})
export class MaterialModule { }
