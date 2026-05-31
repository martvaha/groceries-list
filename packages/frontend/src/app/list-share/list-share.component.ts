import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { map } from 'rxjs/operators';
import { COMMA, ENTER, FF_SEMICOLON } from '@angular/cdk/keycodes';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { FormControl, Validators, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../auth/auth.service';

const MAX_INVITES_PER_BATCH = 10;

interface CreateInviteRequest {
  listId: string;
  emails: string[];
}

interface CreateInviteResult {
  success: boolean;
  created: string[];
  alreadyInvited: string[];
  alreadyMembers: string[];
  failed: string[];
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-list-share',
  styleUrls: ['./list-share.component.scss'],
  templateUrl: './list-share.component.html',
})
export class ListShareComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private functions = inject(Functions);

  emailControl = new FormControl<string | undefined>(undefined, {
    nonNullable: false,
    validators: [Validators.required, Validators.email]
  });
  users: Partial<User>[] = [];
  private listId!: Observable<string>;

  sending = signal(false);
  error = signal<string | null>(null);

  readonly separatorKeysCodes = [ENTER, COMMA, FF_SEMICOLON];

  constructor() {
    effect(() => {
      if (this.sending()) {
        this.emailControl.disable();
      } else {
        this.emailControl.enable();
      }
    });
  }
  readonly separatorChars = [';', ',', '\n'];
  readonly separatorRegex = new RegExp(this.separatorChars.join('|'), 'g');

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id') as string)
    );
  }

  add(event: MatChipInputEvent) {
    this.addEmails(event.value);
  }

  remove(user: any): void {
    const index = this.users.indexOf(user);

    if (index >= 0) {
      this.users.splice(index, 1);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    this.emailControl.patchValue(event?.clipboardData?.getData('text'));
  }

  addEmails(emails: string) {
    const invalid = [];
    const values = emails.split(this.separatorRegex);
    for (const value of values) {
      const trimmedValue = value.trim();
      if (!trimmedValue) continue;
      const { error, value: email } = this.validateEmail(trimmedValue);
      if (error) {
        invalid.push(email);
      } else {
        // Prevent duplicates
        if (!this.users.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
          this.users.push({ email });
        }
      }
    }
    this.emailControl.patchValue(invalid.join(this.separatorChars[0] + ' '));
  }

  validateEmail(value: string) {
    const form = new FormControl(undefined, [
      Validators.email,
      Validators.required,
    ]);

    form.patchValue(value as any);
    if (form.invalid) return { error: form.errors, value: value };

    return { value, error: (undefined as unknown) as ValidationErrors };
  }

  async share(): Promise<void> {
    if (this.users.length < 1 || this.sending()) return;

    // Client-side rate limiting (server also enforces this)
    if (this.users.length > MAX_INVITES_PER_BATCH) {
      this.error.set($localize`:@@share.tooMany:Maximum ${MAX_INVITES_PER_BATCH}:max: invitations per batch`);
      return;
    }

    this.sending.set(true);
    this.error.set(null);

    try {
      const listId = await firstValueFrom(this.listId);
      const emails = this.users.map(u => u.email!).filter(Boolean);

      // Call the createInvite Cloud Function
      // This handles secure ID generation, deduplication, and rate limiting
      const createInviteFn = httpsCallable<CreateInviteRequest, CreateInviteResult>(
        this.functions,
        'createInvite'
      );

      const result = await createInviteFn({ listId, emails });
      const { created, alreadyInvited, alreadyMembers, failed } = result.data;

      // Handle case where no invites were created
      if (created.length === 0) {
        if (alreadyInvited.length > 0 || alreadyMembers.length > 0) {
          const messages: string[] = [];
          if (alreadyInvited.length > 0) {
            messages.push($localize`:@@share.alreadyInvited:${alreadyInvited.length}:count: already invited`);
          }
          if (alreadyMembers.length > 0) {
            messages.push($localize`:@@share.alreadyMembers:${alreadyMembers.length}:count: already members`);
          }
          this.snackBar.open(
            messages.join(', '),
            $localize`:@@common.close:Close`,
            { duration: 5000 }
          );
        } else if (failed.length > 0) {
          throw new Error('All invitations failed');
        }
        this.sending.set(false);
        return;
      }

      // Clear the form on success
      this.users = [];
      this.emailControl.reset();

      // Build success message with details
      let message = $localize`:@@share.success:Invitation sent to ${created.length}:count: recipient(s)`;
      const skipped = alreadyInvited.length + alreadyMembers.length;
      if (skipped > 0) {
        message += ` (${skipped} skipped)`;
      }

      this.snackBar.open(
        message,
        $localize`:@@common.close:Close`,
        { duration: 5000 }
      );

      // Navigate back to the list
      this.router.navigate(['/home/list', listId]);
    } catch (err: any) {
      console.error('Failed to send invites:', err);
      const userMessage = this.getErrorMessage(err);
      this.error.set(userMessage);
      this.snackBar.open(
        $localize`:@@share.error:Failed to send invitations`,
        $localize`:@@common.close:Close`,
        { duration: 5000 }
      );
    } finally {
      this.sending.set(false);
    }
  }

  private getErrorMessage(err: any): string {
    // Map Firebase Cloud Function error codes to user-friendly messages
    const code = err?.code;
    if (code === 'functions/permission-denied') {
      return $localize`:@@share.permissionDenied:You don't have permission to invite people to this list`;
    }
    if (code === 'functions/not-found') {
      return $localize`:@@share.listNotFound:List not found`;
    }
    if (code === 'functions/invalid-argument') {
      return $localize`:@@share.invalidInput:Invalid input. Please check the email addresses`;
    }
    if (code === 'functions/unavailable' || code === 'functions/deadline-exceeded') {
      return $localize`:@@share.networkError:Network error. Please check your connection and try again`;
    }
    if (code === 'functions/unauthenticated') {
      return $localize`:@@share.unauthenticated:Please sign in to send invitations`;
    }
    return $localize`:@@share.genericError:Failed to send invitations. Please try again`;
  }
}
