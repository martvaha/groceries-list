import { ChangeDetectionStrategy, Component, OnInit, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Firestore, doc, docSnapshots } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { selectUser } from '../state/user/user.reducer';
import { User } from '../auth/auth.service';

@Component({
  standalone: false,
  selector: 'app-list-invite-container',
  template: `
    <app-list-invite
      [user]="user | async"
      [inviteId]="inviteId | async"
    ></app-list-invite>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListInviteContainerComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);
  
  public inviteId!: Observable<string>;
  public invite!: Observable<unknown>;
  public user!: Observable<User | null | undefined>;
  public redirect!: Observable<string>;
  private userSubscription!: Subscription;
  
  constructor(
    private route: ActivatedRoute,
    private store: Store
  ) {}

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
