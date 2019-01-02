import { MatDialog, MatDialogConfig } from '@angular/material';
import { Injectable } from '@angular/core';
import { InfoDialogComponent, InfoDialogConfig } from './info-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogConfig } from './confirm-dialog.component';
import { InputDialogComponent, InputDialogConfig } from './input-dialog.component';
import { SharedModule } from '../shared.module';

@Injectable({
  providedIn: SharedModule
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  info(config: InfoDialogConfig) {
    return this.dialog.open(InfoDialogComponent, config);
  }

  confirm(config: ConfirmDialogConfig) {
    return this.dialog.open(ConfirmDialogComponent, config);
  }

  input(config: InputDialogConfig) {
    return this.dialog.open(InputDialogComponent, config);
  }
}
