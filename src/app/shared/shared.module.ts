import { NgModule } from '@angular/core';

import { MaterialModule } from './material.module';
import { ConfirmDialogComponent } from './dialog-service/confirm-dialog.component';
import { InfoDialogComponent } from './dialog-service/info-dialog.component';
import { InputDialogComponent } from './dialog-service/input-dialog.component';
import { DialogService } from './dialog-service/dialog.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingService } from './loading-service';

const modules = [CommonModule, MaterialModule, ReactiveFormsModule];
const entryComponents = [ConfirmDialogComponent, InfoDialogComponent, InputDialogComponent];

@NgModule({
  imports: modules,
  exports: [...modules, ...entryComponents],
  declarations: [...entryComponents],
  entryComponents: entryComponents
})
export class SharedModule {}
