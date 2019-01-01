import { Component, OnInit, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { User } from '../../auth/auth.service';

@Component({
  selector: 'gl-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent implements OnInit, OnChanges {
  private _user: User;
  @Input()
  set user(user: User) {
    console.log(user);
    this._user = user;
  }
  get user() {
    return this._user;
  }

  constructor() {}

  ngOnInit() {}

  ngOnChanges(change) {
    console.log('user-change', change);
  }
}
