import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface InputDialogConfig extends MatDialogConfig {
  data: {
    placeholder: string;
    title?: string;
    actionLabel?: string;
  };
}

@Component({
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    @if (title) {
      <h1 mat-dialog-title>{{ title }}</h1>
    }
    <mat-dialog-content (keydown.enter)="dialogRef.close(input.value)">
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
  dialogRef = inject<MatDialogRef<InputDialogComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);

  title: string;
  placeholder: string;
  actionLabel: string;

  constructor() {
    const data = this.data;

    this.title = data.title;
    this.placeholder = data.placeholder;
    this.actionLabel = data.actionLabel || $localize`:confirm|:OK`;
  }
}
