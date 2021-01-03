import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileContainerComponent } from './profile-container/profile-container.component';
import { ProfileRoutingModule } from './profile.routing';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [ProfileContainerComponent],
  imports: [CommonModule, ProfileRoutingModule, MatIconModule, MatRadioModule, MatButtonModule, ReactiveFormsModule],
})
export class ProfileModule {}
