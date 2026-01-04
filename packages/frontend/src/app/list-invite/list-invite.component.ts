import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../auth/auth.service';
import { AuthComponent } from '../auth/auth.component';

@Component({
  standalone: true,
  imports: [JsonPipe, MatProgressSpinnerModule, AuthComponent],
  selector: 'app-list-invite',
  templateUrl: './list-invite.component.html',
  styleUrls: ['./list-invite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListInviteComponent {
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() user: User | null | undefined;
  readonly inviteId = input<string | null>();

  get redirect() {
    return '/home/invite/' + this.inviteId();
  }
}
