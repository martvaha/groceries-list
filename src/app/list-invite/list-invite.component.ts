import { Component, OnInit, Input } from '@angular/core';
import { User } from '../auth/auth.service';

@Component({
  selector: 'app-list-invite',
  templateUrl: './list-invite.component.html',
  styleUrls: ['./list-invite.component.scss']
})
export class ListInviteComponent implements OnInit {
  @Input() user: User;
  @Input() inviteId: string;

  get redirect() {
    return '/home/invite/' + this.inviteId;
  }

  constructor() {}

  ngOnInit() {}
}
