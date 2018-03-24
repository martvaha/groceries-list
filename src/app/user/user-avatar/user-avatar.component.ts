import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { User } from '../../auth/auth.service';

@Component({
  selector: 'gl-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss']
})
export class UserAvatarComponent implements OnInit, OnChanges {
  @Input() user: User;

  constructor() {}

  ngOnInit() {}

  ngOnChanges(change) {
    console.log(change);
  }
}
