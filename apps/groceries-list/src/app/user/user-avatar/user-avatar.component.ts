import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { User } from '../../auth/auth.service';
import { ThemeService } from '../../shared/theme.service';
import { checkForUpdate } from '../../state/app.actions';
import { State } from '../../state/app.reducer';
import { AppTheme } from '../../state/config/config.reducer';
import { login, logout } from '../../state/user/user.actions';

@Component({
  standalone: false,
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
})
export class UserAvatarComponent implements OnInit {
  @Input() user?: User | null;
  @Output() reload = new EventEmitter();

  theme$!: Observable<AppTheme>;

  themeControl = new FormControl('system');

  constructor(private store: Store<State>, private theme: ThemeService) {}

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
