import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileContainerComponent } from './profile-container/profile-container.component';
import { ProfileRoutingModule } from './profile.routing';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ProfileContainerComponent],
  imports: [CommonModule, ProfileRoutingModule, MatRadioModule, ReactiveFormsModule],
})
export class ProfileModule {}
