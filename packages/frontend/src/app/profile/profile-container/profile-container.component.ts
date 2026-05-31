import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { ThemeService } from '../../shared/theme.service';
import { UserProfileService, UserProfile } from '../../shared/user-profile.service';
import { State } from '../../state/app.reducer';
import { setLanguage } from '../../state/config/config.actions';
import { AppLanguage, AppTheme, selectLanguage } from '../../state/config/config.reducer';
import { selectUser } from '../../state/user/user.reducer';

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  selector: 'app-profile-container',
  templateUrl: './profile-container.component.html',
  styleUrls: ['./profile-container.component.scss'],
})
export class ProfileContainerComponent implements OnInit {
  private theme = inject(ThemeService);
  private store = inject<Store<State>>(Store);
  private icons = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private userProfileService = inject(UserProfileService);
  private snackBar = inject(MatSnackBar);

  themeControl = new FormControl();
  languageControl = new FormControl();
  displayNameControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  systemTheme$!: Observable<AppTheme>;
  profile$!: Observable<UserProfile | null>;
  savingProfile = signal(false);
  private currentUid: string | null = null;

  constructor() {
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

    // Load user profile for display name editing
    this.store
      .select(selectUser)
      .pipe(
        filter((user) => !!user),
        take(1)
      )
      .subscribe((user) => {
        if (user) {
          this.currentUid = user.uid;
          // Set initial value from Firebase Auth as fallback
          if (user.displayName) {
            this.displayNameControl.setValue(user.displayName);
          }
          // Then try to load from Firestore profile (may override with custom name)
          this.profile$ = this.userProfileService.getMyProfile(user.uid);
          this.profile$.pipe(filter((p) => !!p), take(1)).subscribe((profile) => {
            if (profile?.displayName) {
              this.displayNameControl.setValue(profile.displayName);
            }
          });
        }
      });
  }

  onThemeChange(event: MatRadioChange) {
    this.theme.setTheme(event.value);
  }

  onLanguageChange(language: AppLanguage) {
    this.store.dispatch(setLanguage({ language }));
  }

  async saveDisplayName(): Promise<void> {
    if (!this.currentUid || this.displayNameControl.invalid || this.savingProfile()) return;

    const displayName = this.displayNameControl.value?.trim();
    if (!displayName) return;

    this.savingProfile.set(true);

    try {
      await this.userProfileService.updateProfile(this.currentUid, { displayName });
      this.snackBar.open(
        $localize`:@@profile.nameSaved:Display name saved`,
        $localize`:@@common.close:Close`,
        { duration: 3000 }
      );
    } catch (err) {
      console.error('Failed to save display name:', err);
      this.snackBar.open(
        $localize`:@@profile.nameSaveFailed:Failed to save display name`,
        $localize`:@@common.close:Close`,
        { duration: 3000 }
      );
    } finally {
      this.savingProfile.set(false);
    }
  }
}
