import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import { User } from '../../auth/auth.service';
import { Store } from '@ngrx/store';
import { State } from '../../state/app.reducer';
import { logout, login } from '../../state/user/user.actions';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],

})
export class UserAvatarComponent {
  @Input() user?: User | null;
  @Output() reload = new EventEmitter();

  constructor(private store: Store<State>) {}

  login() {
    this.store.dispatch(login(['home']));
  }

  logout() {
    this.store.dispatch(logout());
  }
}
