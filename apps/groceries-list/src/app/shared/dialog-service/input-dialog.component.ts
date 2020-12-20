import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

export interface InputDialogConfig extends MatDialogConfig {
  data: {
    placeholder: string;
    title?: string;
    actionLabel?: string;
  };
}

@Component({
  template: `
    <h1 *ngIf="title" mat-dialog-title>{{ title }}</h1>
    <mat-dialog-content>
      <mat-form-field floatLabel="auto">
        <input matInput #input type="text" required [placeholder]="placeholder" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close (click)="dialogRef.close(input.value)">
        {{ actionLabel }}
      </button>
    </mat-dialog-actions>
  `,
})
export class InputDialogComponent {
  title: string;
  placeholder: string;
  actionLabel: string;

  constructor(public dialogRef: MatDialogRef<InputDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.title = data.title;
    this.placeholder = data.placeholder;
    this.actionLabel = data.actionLabel || 'Ok';
  }
}
