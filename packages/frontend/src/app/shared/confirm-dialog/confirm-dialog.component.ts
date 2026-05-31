import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText }}</button>
      <button
        mat-flat-button
        [color]="data.confirmColor || 'primary'"
        [mat-dialog-close]="true"
      >
        {{ data.confirmText }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content p {
      margin: 0;
    }
  `],
})
export class ConfirmDialogComponent {
  public data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}
