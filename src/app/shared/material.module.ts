import { NgModule } from '@angular/core';

import {
  MatButtonModule,
  MatCheckboxModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatDialogModule,
  MatInputModule,
  MatAutocompleteModule,
  MatSnackBarModule,
  MatMenuModule
} from '@angular/material';

const modules = [
  MatButtonModule,
  MatCheckboxModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatDialogModule,
  MatInputModule,
  MatAutocompleteModule,
  MatSnackBarModule,
  MatMenuModule
];

@NgModule({
  imports: modules,
  exports: modules,
  declarations: [],
  providers: []
})
export class MaterialModule {}
