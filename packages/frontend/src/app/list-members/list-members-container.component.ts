import { ChangeDetectionStrategy, Component, OnInit, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { map, switchMap, catchError, filter, combineLatestWith, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Firestore, doc, docSnapshots, collection, query, where, collectionSnapshots, limit } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { selectUser } from '../state/user/user.reducer';
import { User } from '../auth/auth.service';
import { ListMembersComponent, MemberInfo, PendingInvite } from './list-members.component';
import { List } from '../shared/models';

@Component({
  standalone: true,
  imports: [AsyncPipe, ListMembersComponent],
  selector: 'app-list-members-container',
  template: `
    <app-list-members
      [user]="user | async"
      [listId]="listId | async"
      [list]="list | async"
      [pendingInvites]="(pendingInvites | async) ?? []"
      [memberInfoMap]="(memberInfoMap | async) || emptyMemberMap"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListMembersContainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);

  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  public listId!: Observable<string>;
  public list!: Observable<List | null>;
  public user!: Observable<User | null | undefined>;
  public pendingInvites!: Observable<PendingInvite[]>;
  public memberInfoMap!: Observable<Map<string, MemberInfo>>;
  public readonly emptyMemberMap = new Map<string, MemberInfo>();

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id') as string)
    );
    this.user = this.store.select(selectUser);

    // Load list data when user is authenticated
    this.list = this.user.pipe(
      filter((user): user is User => user !== null && user !== undefined),
      combineLatestWith(this.listId),
      switchMap(([_, listId]): Observable<List | null> => {
        return runInInjectionContext(this.injector, () => {
          const listDoc = doc(this.firestore, '/lists/' + listId);
          return docSnapshots(listDoc).pipe(
            map((snapshot) => {
              if (!snapshot.exists()) {
                return null;
              }
              const data = snapshot.data();
              return { ...data, id: snapshot.id } as List;
            }),
            catchError((error) => {
              console.error('Failed to load list:', error);
              return of(null);
            })
          );
        });
      }),
      startWith<List | null>(null)
    );

    // Load pending invites for this list
    this.pendingInvites = this.user.pipe(
      filter((user): user is User => user !== null && user !== undefined),
      combineLatestWith(this.listId),
      switchMap(([_, listId]) => {
        return runInInjectionContext(this.injector, () => {
          const invitesCollection = collection(this.firestore, 'invites');
          const invitesQuery = query(invitesCollection, where('listId', '==', listId));
          return collectionSnapshots(invitesQuery).pipe(
            map((snapshots) =>
              snapshots.map((snap) => ({
                id: snap.id,
                ...snap.data(),
              })) as PendingInvite[]
            ),
            catchError((error) => {
              console.error('Failed to load pending invites:', error);
              return of([]);
            })
          );
        });
      }),
      startWith([])
    );

    // Load member info for this list (limit to 100 to prevent unbounded queries)
    this.memberInfoMap = this.user.pipe(
      filter((user): user is User => user !== null && user !== undefined),
      combineLatestWith(this.listId),
      switchMap(([_, listId]) => {
        return runInInjectionContext(this.injector, () => {
          const membersCollection = collection(this.firestore, `lists/${listId}/members`);
          const membersQuery = query(membersCollection, limit(100));
          return collectionSnapshots(membersQuery).pipe(
            map((snapshots) => {
              const memberMap = new Map<string, MemberInfo>();
              for (const snap of snapshots) {
                const data = snap.data();
                memberMap.set(snap.id, {
                  uid: snap.id,
                  email: data['email'],
                  displayName: data['displayName'],
                });
              }
              return memberMap;
            }),
            catchError((error) => {
              console.error('Failed to load member info:', error);
              return of(new Map<string, MemberInfo>());
            })
          );
        });
      }),
      startWith(new Map<string, MemberInfo>())
    );
  }
}
