import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthComponent } from '../auth/auth.component';
import { ConfirmDialogComponent } from './dialog-service/confirm-dialog.component';
import { InfoDialogComponent } from './dialog-service/info-dialog.component';
import { InputDialogComponent } from './dialog-service/input-dialog.component';
import { FavoriteButtonComponent } from './favorite-button/favorite-button.component';
import { LongPressDirective } from './long-press.directive';
import { MaterialModule } from './material.module';

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
