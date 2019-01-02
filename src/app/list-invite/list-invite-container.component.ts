import { Component, OnInit } from '@angular/core';
import { map, switchMap, filter, take } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AngularFirestore } from 'angularfire2/firestore';
import { MatChipInputEvent } from '@angular/material';
import { AuthService, User } from '../auth/auth.service';
import { OnDestroy } from '@angular/core';

export interface Item {
  id: string;
  name: string;
  displayName: string;
}

@Component({
  selector: 'gl-list-invite-container',
  template: `
    <gl-list-invite [user]="user | async" [inviteId]="inviteId | async"></gl-list-invite>
  `
})
export class ListInviteContainerComponent implements OnInit, OnDestroy {
  public inviteId: Observable<string>;
  public invite: Observable<any>;
  public user: Observable<User | null | undefined>;
  public redirect: Observable<string>;
  private userSubscription: Subscription;
  constructor(private route: ActivatedRoute, private db: AngularFirestore, private auth: AuthService) {}

  ngOnInit() {
    this.inviteId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id') as string));
    this.user = this.auth.user;
    this.invite = this.inviteId.pipe(
      switchMap(inviteId => this.db.doc('/invites/' + inviteId).snapshotChanges()),
      map(changes => changes.payload.data())
    );
  }

  ngOnDestroy() {}
}
