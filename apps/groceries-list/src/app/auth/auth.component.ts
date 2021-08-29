import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { environment } from '../../environments/environment';
import { State } from '../state/app.reducer';
import { login } from '../state/user/user.actions';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  appName = environment.appName;
  @Input() redirect = 'home';

  constructor(private store: Store<State>) {}

  logIn(provider: 'google' | 'facebook') {
    this.store.dispatch(login({ redirect: this.redirect, provider }));
  }
}
