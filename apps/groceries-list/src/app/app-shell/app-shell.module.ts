import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AppShellComponent } from './app-shell.component';

@NgModule({
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  declarations: [AppShellComponent],
  exports: [AppShellComponent],
})
export class AppShellModule {}
