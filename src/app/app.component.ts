import { Component } from '@angular/core';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'gl-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Groceries List';

  constructor(auth: AuthService) {

  }
}
