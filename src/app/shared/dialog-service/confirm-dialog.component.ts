import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material';

export interface ConfirmDialogConfig extends MatDialogConfig {
  data: {
    message: string;
    title?: string;
  };
}

@Component({
  template: `
  <h1 mat-dialog-title *ngIf="title">{{title}}</h1>
  <mat-dialog-content>
    {{ message }}
  </mat-dialog-content>
  <mat-dialog-actions>
    <button mat-raised-button color="warn" (click)="dialogRef.close(true)">Jah</button>
    <button mat-raised-button mat-dialog-close>Ei</button>
  </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {

  title: string;
  message: string;

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.title = data.title;
    this.message = data.message;
  }
}
