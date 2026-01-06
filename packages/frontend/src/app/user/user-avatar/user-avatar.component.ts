import { Component, OnInit, inject, output, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { User } from '../../auth/auth.service';
import { ThemeService } from '../../shared/theme.service';
import { checkForUpdate } from '../../state/app.actions';
import { State } from '../../state/app.reducer';
import { AppTheme } from '../../state/config/config.reducer';
import { login, logout } from '../../state/user/user.actions';

@Component({
  standalone: true,
  imports: [NgStyle, RouterLink, MatButtonModule, MatIconModule, MatMenuModule],
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
})
export class UserAvatarComponent implements OnInit {
  private store = inject<Store<State>>(Store);
  private theme = inject(ThemeService);

  readonly user = input<User | null>();
  readonly reload = output();

  theme$!: Observable<AppTheme>;

  themeControl = new FormControl('system');

  ngOnInit(): void {
    this.theme$ = this.theme.activeThemeValueChanges();
  }

  toggleTheme() {
    this.theme$.pipe(take(1)).subscribe((theme) => {
      this.theme.setTheme(theme === 'light' ? 'dark' : 'light');
    });
  }

  login() {
    this.store.dispatch(login({ provider: 'google', redirect: ['home'] }));
  }

  logout() {
    this.store.dispatch(logout());
  }

  checkForUpdate() {
    this.store.dispatch(checkForUpdate());
  }
}
