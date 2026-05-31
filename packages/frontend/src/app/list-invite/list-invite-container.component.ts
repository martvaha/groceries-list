import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { map, switchMap, catchError, filter, combineLatestWith, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Store } from '@ngrx/store';
import { selectUser } from '../state/user/user.reducer';
import { User } from '../auth/auth.service';
import { ListInviteComponent, InviteData, InvitePreview } from './list-invite.component';

@Component({
  standalone: true,
  imports: [AsyncPipe, ListInviteComponent],
  selector: 'app-list-invite-container',
  template: `
    <app-list-invite
      [user]="user | async"
      [inviteId]="inviteId | async"
      [invite]="invite | async"
      [preview]="preview | async"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListInviteContainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);

  private functions = inject(Functions);
  private injector = inject(EnvironmentInjector);

  public inviteId!: Observable<string>;
  public invite!: Observable<InviteData | null>;
  public preview!: Observable<InvitePreview | null>;
  public user!: Observable<User | null | undefined>;

  ngOnInit() {
    this.inviteId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id') as string));
    this.user = this.store.select(selectUser);

    // Public, non-PII preview ("X invited you to <list>") so we can show context
    // before the visitor signs in. Does not require authentication.
    this.preview = this.inviteId.pipe(
      switchMap((inviteId): Observable<InvitePreview | null> => {
        return runInInjectionContext(this.injector, () => {
          const getInvitePreviewFn = httpsCallable<{ inviteId: string }, InvitePreview>(
            this.functions,
            'getInvitePreview',
          );
          return from(getInvitePreviewFn({ inviteId })).pipe(
            map((result) => result.data),
            catchError((error) => {
              console.error('Failed to load invite preview:', error);
              return of(null);
            }),
          );
        });
      }),
      startWith<InvitePreview | null>(null),
    );

    // Only fetch invite details when user is authenticated. The lookup goes through
    // the getInvite callable so the invitee email (PII) is never sent to the client.
    this.invite = this.user.pipe(
      filter((user): user is User => user !== null && user !== undefined),
      combineLatestWith(this.inviteId),
      switchMap(([_, inviteId]): Observable<InviteData | null> => {
        return runInInjectionContext(this.injector, () => {
          const getInviteFn = httpsCallable<{ inviteId: string }, InviteData>(this.functions, 'getInvite');
          return from(getInviteFn({ inviteId })).pipe(
            map((result) => result.data),
            catchError((error) => {
              console.error('Failed to load invite:', error);
              return of(null);
            }),
          );
        });
      }),
      startWith<InviteData | null>(null),
    );
  }
}
