import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogConfig extends MatDialogConfig {
  data: ConfirmDialogData;
}

export interface ConfirmDialogData {
  message: string;
  title?: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  cancelLabel?: string;
}

@Component({
  standalone: false,
  template: `
    <h1 mat-dialog-title *ngIf="data.title">{{ data.title }}</h1>
    <mat-dialog-content> {{ data.message }} </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button mat-dialog-close>
        {{ data.cancelLabel }}
      </button>
      <button mat-raised-button [color]="data.confirmColor || 'warn'" (click)="dialogRef.close(true)">
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    data.cancelLabel = data.cancelLabel || $localize`Cancel`;
    data.confirmLabel = data.confirmLabel || $localize`Yes`;
  }
}
