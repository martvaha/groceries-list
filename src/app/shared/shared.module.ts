import { NgModule } from '@angular/core';

import { MaterialModule } from './material.module';
import { ConfirmDialogComponent } from './dialog-service/confirm-dialog.component';
import { InfoDialogComponent } from './dialog-service/info-dialog.component';
import { InputDialogComponent } from './dialog-service/input-dialog.component';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthComponent } from '../auth/auth.component';
import { LongPressDirective } from './long-press.directive';

const modules = [CommonModule, MaterialModule, ReactiveFormsModule];
const components = [AuthComponent, LongPressDirective];
const entryComponents = [ConfirmDialogComponent, InfoDialogComponent, InputDialogComponent];

@NgModule({
  imports: modules,
  exports: [...modules, ...entryComponents, ...components],
  declarations: [...entryComponents, ...components],
  entryComponents: entryComponents
})
export class SharedModule {}
