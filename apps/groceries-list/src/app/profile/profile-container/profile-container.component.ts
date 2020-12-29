import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { ThemeService } from '../../shared/theme.service';
import { AppTheme } from '../../state/config/config.reducer';

@Component({
  selector: 'app-profile-container',
  templateUrl: './profile-container.component.html',
  styleUrls: ['./profile-container.component.scss'],
})
export class ProfileContainerComponent implements OnInit {
  themeControl = new FormControl();
  systemTheme$!: Observable<AppTheme>;

  constructor(private theme: ThemeService) {}

  ngOnInit(): void {
    // Only take first value for now, should update when theme is persisted in firestore
    this.theme
      .selectedThemeValueChanges()
      .pipe(take(1))
      .subscribe((theme) => this.themeControl.patchValue(theme));

    this.systemTheme$ = this.theme.systemThemeValueChanges();
  }

  onThemeChange(event: MatRadioChange) {
    this.theme.setTheme(event.value);
  }
}
