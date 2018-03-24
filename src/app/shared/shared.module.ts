import { NgModule } from '@angular/core';

import { MaterialModule } from './material.module';
import { ConfirmDialogComponent } from './dialog-service/confirm-dialog.component';
import { InfoDialogComponent } from './dialog-service/info-dialog.component';
import { InputDialogComponent } from './dialog-service/input-dialog.component';
import { DialogService } from './dialog-service/dialog.service';
import { CommonModule } from '@angular/common';

const modules = [CommonModule , MaterialModule];
const entryComponents = [ConfirmDialogComponent, InfoDialogComponent, InputDialogComponent];
const services = [DialogService];

@NgModule({
  imports: modules,
  exports: [...modules, ...entryComponents],
  declarations: [...entryComponents],
  providers: services,
  entryComponents: entryComponents
})
export class SharedModule {}
