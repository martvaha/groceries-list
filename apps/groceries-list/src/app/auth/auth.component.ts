import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { State } from '../state/app.reducer';
import { login } from '../state/user/user.actions';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  @Input() redirect = 'home';

  constructor(private store: Store<State>) {}

  logIn() {
    this.store.dispatch(login(this.redirect));
  }
}
