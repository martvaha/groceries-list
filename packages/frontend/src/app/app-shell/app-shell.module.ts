import { NgModule } from '@angular/core';

import { AppShellComponent } from './app-shell.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  declarations: [AppShellComponent],
  exports: [AppShellComponent],
})
export class AppShellModule {}
