import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from './auth.service';
import { Store } from '@ngrx/store';
import { State } from '../state/app.reducer';
import { login } from '../state/user/user.actions';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  @Input() redirect = 'home';

  constructor(private store: Store<State>) {}

  ngOnInit() {}

  logIn() {
    this.store.dispatch(login(this.redirect));
  }
  logOut() {}
}
