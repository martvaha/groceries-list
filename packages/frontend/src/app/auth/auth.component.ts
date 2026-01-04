import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../environments/environment';
import { State } from '../state/app.reducer';
import { login } from '../state/user/user.actions';

@Component({
  standalone: true,
  imports: [MatButtonModule],
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private store = inject<Store<State>>(Store);

  appName = environment.appName;
  readonly redirect = input('home');

  logIn(provider: 'google' | 'facebook') {
    this.store.dispatch(login({ redirect: this.redirect(), provider }));
  }
}
