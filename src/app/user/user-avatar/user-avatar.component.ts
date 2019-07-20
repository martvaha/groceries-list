import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { User, AuthService } from '../../auth/auth.service';
import { Store } from '@ngrx/store';
import { State } from '../../state/app.reducer';
import { logout, login } from '../../state/user/user.actions';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent {
  @Input() user: User;

  constructor(private store: Store<State>) {}

  login() {
    this.store.dispatch(login());
  }

  logout() {
    this.store.dispatch(logout());
  }
}
