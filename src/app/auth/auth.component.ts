import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'gl-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  @Input() redirect = 'home';

  constructor(private auth: AuthService) { }

  ngOnInit() {
  }

  logIn() {
    this.auth.signInWithFacebook(this.redirect);
  }
  logOut() {

  }

}
