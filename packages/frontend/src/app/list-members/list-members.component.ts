import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { Firestore, doc, deleteDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { User } from '../auth/auth.service';
import { List } from '../shared/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog.component';

export interface MemberInfo {
  uid: string;
  email?: string;
  displayName?: string;
}

export interface PendingInvite {
  id: string;
  to: string;
  listId: string;
  listName?: string;
  userName?: string;
  createdAt?: any;
  expiresAt?: any;
}

interface RemoveMemberResponse {
  success: boolean;
  removedSelf: boolean;
  newOwner: string | null;
}

@Component({
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    MatDialogModule,
    RouterLink,
  ],
  selector: 'app-list-members',
  templateUrl: './list-members.component.html',
  styleUrls: ['./list-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListMembersComponent {
  private firestore = inject(Firestore);
  private functions = inject(Functions);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  @Input() user: User | null | undefined;
  @Input() listId: string | null = null;
  @Input() list: List | null = null;
  @Input() pendingInvites: PendingInvite[] = [];
  @Input() memberInfoMap: Map<string, MemberInfo> = new Map();

  removing = signal<string | null>(null);
  cancellingInvite = signal<string | null>(null);

  get owner(): string {
    // Use owner field if present, otherwise fall back to first ACL member
    return this.list?.owner || this.list?.acl?.[0] || '';
  }

  get isOwner(): boolean {
    return this.owner === this.user?.uid;
  }

  get members(): string[] {
    return this.list?.acl || [];
  }

  canRemoveMember(memberUid: string): boolean {
    // Can't remove yourself if you're the only member
    if (this.members.length <= 1) return false;

    // Owner can remove any member (including themselves - ownership auto-transfers)
    // Non-owners can only remove themselves (leave the list)
    const isRemovingSelf = memberUid === this.user?.uid;
    return this.isOwner || isRemovingSelf;
  }

  async confirmRemoveMember(memberUid: string): Promise<void> {
    if (!this.canRemoveMember(memberUid)) return;

    const isRemovingSelf = memberUid === this.user?.uid;
    const memberLabel = this.getMemberLabel(memberUid);

    const dialogData: ConfirmDialogData = isRemovingSelf
      ? {
          title: $localize`:@@members.leaveTitle:Leave list?`,
          message: $localize`:@@members.leaveMessage:Are you sure you want to leave this list? You will lose access to all items.`,
          confirmText: $localize`:@@members.leaveConfirm:Leave`,
          cancelText: $localize`:@@common.cancel:Cancel`,
          confirmColor: 'warn',
        }
      : {
          title: $localize`:@@members.removeTitle:Remove member?`,
          message: $localize`:@@members.removeMessage:Are you sure you want to remove ${memberLabel}:member: from this list?`,
          confirmText: $localize`:@@members.removeConfirm:Remove`,
          cancelText: $localize`:@@common.cancel:Cancel`,
          confirmColor: 'warn',
        };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '320px',
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await this.removeMember(memberUid);
    }
  }

  async removeMember(memberUid: string): Promise<void> {
    if (!this.listId || this.removing()) return;

    const isRemovingSelf = memberUid === this.user?.uid;

    this.removing.set(memberUid);

    try {
      const removeMemberFn = httpsCallable<{ listId: string; memberUid: string }, RemoveMemberResponse>(
        this.functions,
        'removeMember'
      );
      const result = await removeMemberFn({ listId: this.listId, memberUid });

      this.snackBar.open(
        isRemovingSelf
          ? $localize`:@@members.left:You have left the list`
          : $localize`:@@members.removed:Member removed`,
        $localize`:@@common.close:Close`,
        { duration: 3000 }
      );

      // If removing self, navigate away
      if (result.data.removedSelf) {
        this.router.navigate(['/home/lists']);
      }
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      const message = this.getErrorMessage(err);
      this.snackBar.open(message, $localize`:@@common.close:Close`, { duration: 3000 });
    } finally {
      this.removing.set(null);
    }
  }

  private getErrorMessage(err: any): string {
    const code = err?.code;
    if (code === 'functions/permission-denied') {
      return $localize`:@@members.permissionDenied:You don't have permission to remove this member`;
    }
    if (code === 'functions/failed-precondition') {
      return $localize`:@@members.cannotRemoveLast:Cannot remove the last member`;
    }
    return $localize`:@@members.removeFailed:Failed to remove member`;
  }

  async confirmCancelInvite(invite: PendingInvite): Promise<void> {
    const dialogData: ConfirmDialogData = {
      title: $localize`:@@members.cancelInviteTitle:Cancel invitation?`,
      message: $localize`:@@members.cancelInviteMessage:Are you sure you want to cancel the invitation to ${invite.to}:email:?`,
      confirmText: $localize`:@@members.cancelInviteConfirm:Cancel Invitation`,
      cancelText: $localize`:@@common.back:Back`,
      confirmColor: 'warn',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '320px',
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await this.cancelInvite(invite.id);
    }
  }

  async cancelInvite(inviteId: string): Promise<void> {
    if (this.cancellingInvite()) return;

    this.cancellingInvite.set(inviteId);

    try {
      const inviteDoc = doc(this.firestore, `/invites/${inviteId}`);
      await deleteDoc(inviteDoc);

      this.snackBar.open(
        $localize`:@@members.inviteCancelled:Invitation cancelled`,
        $localize`:@@common.close:Close`,
        { duration: 3000 }
      );
    } catch (err: any) {
      console.error('Failed to cancel invite:', err);
      this.snackBar.open(
        $localize`:@@members.cancelFailed:Failed to cancel invitation`,
        $localize`:@@common.close:Close`,
        { duration: 3000 }
      );
    } finally {
      this.cancellingInvite.set(null);
    }
  }

  getMemberLabel(memberUid: string): string {
    if (memberUid === this.user?.uid) {
      return $localize`:@@members.you:You`;
    }

    // Check memberInfoMap for stored info
    const info = this.memberInfoMap.get(memberUid);
    if (info?.displayName) {
      return info.displayName;
    }
    if (info?.email) {
      return info.email;
    }

    // Fallback to truncated UID
    return memberUid.substring(0, 8) + '...';
  }

  isInviteExpired(invite: PendingInvite): boolean {
    if (!invite.expiresAt) return false;
    const expiresAt = invite.expiresAt.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt);
    return expiresAt < new Date();
  }

  get activeInvites(): PendingInvite[] {
    return this.pendingInvites.filter(invite => !this.isInviteExpired(invite));
  }

  get expiredInvites(): PendingInvite[] {
    return this.pendingInvites.filter(invite => this.isInviteExpired(invite));
  }
}
