import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { User, AuthService } from '../../auth/auth.service';

@Component({
  selector: 'gl-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent implements OnInit {
  @Input() user: User;

  constructor(public authService: AuthService) {}

  ngOnInit() {}
}
