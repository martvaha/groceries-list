import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { User } from '../../auth/auth.service';
import { Store } from '@ngrx/store';
import { State } from '../../state/app.reducer';
import { logout, login } from '../../state/user/user.actions';
import { ThemeService } from '../../shared/theme.service';
import { AppTheme } from '../../state/config/config.reducer';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
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
    this.store.dispatch(login({ provider: 'facebook', redirect: ['home'] }));
  }

  logout() {
    this.store.dispatch(logout());
  }
}
