import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { User } from '../auth/auth.service';

@Component({
  standalone: false,
  selector: 'app-list-invite',
  templateUrl: './list-invite.component.html',
  styleUrls: ['./list-invite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListInviteComponent {
  @Input() user: User | null | undefined;
  @Input() inviteId: string | null | undefined;

  get redirect() {
    return '/home/invite/' + this.inviteId;
  }
}
