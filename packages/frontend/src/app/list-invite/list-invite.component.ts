import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { User, AuthService } from '../auth/auth.service';
import { login } from '../state/user/user.actions';

export interface InviteData {
  listName?: string;
  userName?: string;
}

export interface InvitePreview {
  listName?: string;
  inviterName?: string;
}

interface AcceptInviteResponse {
  success: boolean;
  listId: string;
  listName?: string;
  message?: string;
}

@Component({
  standalone: true,
  imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule, MatCardModule],
  selector: 'app-list-invite',
  templateUrl: './list-invite.component.html',
  styleUrls: ['./list-invite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListInviteComponent {
  private functions = inject(Functions);
  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);

  @Input() user: User | null | undefined;
  @Input() inviteId: string | null = null;
  @Input() invite: InviteData | null = null;
  @Input() preview: InvitePreview | null = null;

  accepting = signal(false);
  error = signal<string | null>(null);

  sendingLink = signal(false);
  linkSent = signal(false);
  linkError = signal<string | null>(null);

  get redirect() {
    return '/home/invite/' + this.inviteId;
  }

  continueWithGoogle(): void {
    this.store.dispatch(login({ redirect: this.redirect, provider: 'google' }));
  }

  async sendSignInLink(): Promise<void> {
    if (!this.inviteId || this.sendingLink()) return;

    this.sendingLink.set(true);
    this.linkError.set(null);

    try {
      const requestLinkFn = httpsCallable<{ inviteId: string }, { success: boolean }>(
        this.functions,
        'requestInviteSignInLink',
      );
      await requestLinkFn({ inviteId: this.inviteId });
      this.linkSent.set(true);
    } catch (err: any) {
      console.error('Failed to send sign-in link:', err);
      this.linkError.set(
        err.message || $localize`:@@invite.sendLinkFailed:Failed to send the sign-in link. Please try again.`,
      );
    } finally {
      this.sendingLink.set(false);
    }
  }

  switchAccount(): void {
    // Sign out and return to this invite so the visitor can choose another account.
    this.authService.signOut(['/home/invite', this.inviteId ?? '']);
  }

  async acceptInvite(): Promise<void> {
    if (!this.inviteId || this.accepting()) return;

    this.accepting.set(true);
    this.error.set(null);

    try {
      const acceptInviteFn = httpsCallable<{ inviteId: string }, AcceptInviteResponse>(
        this.functions,
        'acceptInvite',
      );
      const result = await acceptInviteFn({ inviteId: this.inviteId });

      if (result.data.success) {
        // Navigate to the shared list
        this.router.navigate(['/home/list', result.data.listId]);
      }
    } catch (err: any) {
      console.error('Failed to accept invite:', err);
      this.error.set(err.message || $localize`:@@invite.acceptFailed:Failed to accept invite. Please try again.`);
      this.accepting.set(false);
    }
  }
}
