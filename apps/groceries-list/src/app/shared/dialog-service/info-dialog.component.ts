import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

export interface InfoDialogConfig extends MatDialogConfig {
  data: {
    message: string;
    title?: string;
    actionLabel?: string;
  };
}

@Component({
  standalone: false,
  template: `
    <h1 mat-dialog-title *ngIf="title">{{ title }}</h1>
    <mat-dialog-content> {{ message }} </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        {{ actionLabel }}
      </button>
    </mat-dialog-actions>
  `,
})
export class InfoDialogComponent {
  title: string;
  message: string;
  actionLabel: string;

  constructor(public dialogRef: MatDialogRef<InfoDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.title = data.title;
    this.message = data.message;
    this.actionLabel = data.actionLabel || $localize`:confirm|:OK`;
  }
}
