import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { MatRadioChange } from '@angular/material/radio';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { ThemeService } from '../../shared/theme.service';
import { State } from '../../state/app.reducer';
import { setLanguage } from '../../state/config/config.actions';
import { AppTheme, selectLanguage } from '../../state/config/config.reducer';

@Component({
  selector: 'app-profile-container',
  templateUrl: './profile-container.component.html',
  styleUrls: ['./profile-container.component.scss'],
})
export class ProfileContainerComponent implements OnInit {
  themeControl = new FormControl();
  languageControl = new FormControl();
  systemTheme$!: Observable<AppTheme>;

  constructor(
    private theme: ThemeService,
    private store: Store<State>,
    private icons: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {
    this.icons.addSvgIcon('en', this.sanitizer.bypassSecurityTrustResourceUrl('assets/flags/en.svg'));
    this.icons.addSvgIcon('et', this.sanitizer.bypassSecurityTrustResourceUrl('assets/flags/et.svg'));
  }

  ngOnInit(): void {
    // Only take first value for now, should update when theme is persisted in firestore
    this.theme
      .selectedThemeValueChanges()
      .pipe(take(1))
      .subscribe((theme) => this.themeControl.patchValue(theme));

    this.store
      .select(selectLanguage)
      .pipe(take(1))
      .subscribe((language) => this.languageControl.patchValue(language));

    this.systemTheme$ = this.theme.systemThemeValueChanges();
  }

  onThemeChange(event: MatRadioChange) {
    this.theme.setTheme(event.value);
  }

  onLanguageChange(event: MatRadioChange) {
    this.store.dispatch(setLanguage({ language: event.value }));
  }
}
