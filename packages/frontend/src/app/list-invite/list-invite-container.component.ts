import { ChangeDetectionStrategy, Component, OnInit, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Firestore, doc, docSnapshots } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { selectUser } from '../state/user/user.reducer';
import { User } from '../auth/auth.service';
import { ListInviteComponent } from './list-invite.component';

@Component({
  standalone: true,
  imports: [AsyncPipe, ListInviteComponent],
  selector: 'app-list-invite-container',
  template: `
    <app-list-invite [user]="user | async"
      [inviteId]="inviteId | async"
     />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListInviteContainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);

  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);
  
  public inviteId!: Observable<string>;
  public invite!: Observable<unknown>;
  public user!: Observable<User | null | undefined>;
  public redirect!: Observable<string>;
  private userSubscription!: Subscription;

  ngOnInit() {
    this.inviteId = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id') as string)
    );
    this.user = this.store.select(selectUser);
    this.invite = this.inviteId.pipe(
      switchMap((inviteId) => {
        return runInInjectionContext(this.injector, () => {
          const inviteDoc = doc(this.firestore, '/invites/' + inviteId);
          return docSnapshots(inviteDoc);
        });
      }),
      map((snapshot) => snapshot.data())
    );
  }
}
