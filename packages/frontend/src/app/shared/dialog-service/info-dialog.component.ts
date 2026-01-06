import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface InfoDialogConfig extends MatDialogConfig {
  data: {
    message: string;
    title?: string;
    actionLabel?: string;
  };
}

@Component({
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule],
  template: `
    @if (title) {
      <h1 mat-dialog-title>{{ title }}</h1>
    }
    <mat-dialog-content> {{ message }} </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        {{ actionLabel }}
      </button>
    </mat-dialog-actions>
    `,
})
export class InfoDialogComponent {
  dialogRef = inject<MatDialogRef<InfoDialogComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);

  title: string;
  message: string;
  actionLabel: string;

  constructor() {
    const data = this.data;

    this.title = data.title;
    this.message = data.message;
    this.actionLabel = data.actionLabel || $localize`:confirm|:OK`;
  }
}
