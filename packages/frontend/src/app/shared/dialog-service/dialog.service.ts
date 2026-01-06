import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Injectable, inject } from '@angular/core';
import { InfoDialogComponent, InfoDialogConfig } from './info-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogConfig } from './confirm-dialog.component';
import { InputDialogComponent, InputDialogConfig } from './input-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialog = inject(MatDialog);


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
