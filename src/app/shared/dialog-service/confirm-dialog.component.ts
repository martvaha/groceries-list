import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material';

export interface ConfirmDialogConfig extends MatDialogConfig {
  data: ConfirmDialogData;
}

export interface ConfirmDialogData {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  template: `
    <h1 mat-dialog-title *ngIf="data.title">{{ data.title }}</h1>
    <mat-dialog-content> {{ data.message }} </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button mat-dialog-close>{{ data.cancelLabel || 'Tühista' }}</button>
      <button mat-raised-button color="warn" (click)="dialogRef.close(true)">{{ data.confirmLabel || 'Jah' }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
