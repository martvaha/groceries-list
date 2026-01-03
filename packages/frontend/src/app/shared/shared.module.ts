import { NgModule } from '@angular/core';

import { MaterialModule } from './material.module';
import { ConfirmDialogComponent } from './dialog-service/confirm-dialog.component';
import { InfoDialogComponent } from './dialog-service/info-dialog.component';
import { InputDialogComponent } from './dialog-service/input-dialog.component';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthComponent } from '../auth/auth.component';
import { LongPressDirective } from './long-press.directive';
import { FavoriteButtonComponent } from './favorite-button/favorite-button.component';

const modules = [CommonModule, MaterialModule, ReactiveFormsModule];
const components = [
  AuthComponent,
  LongPressDirective,
  ConfirmDialogComponent,
  InfoDialogComponent,
  InputDialogComponent,
  FavoriteButtonComponent,
];

@NgModule({
  imports: modules,
  exports: [...modules, ...components],
  declarations: [components],
})
export class SharedModule {}
