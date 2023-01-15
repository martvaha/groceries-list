import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ProfileContainerComponent } from './profile-container/profile-container.component';
import { ProfileRoutingModule } from './profile.routing';

@NgModule({
  declarations: [ProfileContainerComponent],
  imports: [CommonModule, ProfileRoutingModule, MatIconModule, MatRadioModule, MatButtonModule, ReactiveFormsModule],
})
export class ProfileModule {}
