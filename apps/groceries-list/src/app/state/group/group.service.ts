import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  DocumentChangeAction,
} from '@angular/fire/firestore';
import { map, tap, mergeMap, exhaustMap } from 'rxjs/operators';
import { Group } from '../../shared/models';
import { Store } from '@ngrx/store';
import { State } from '../app.reducer';
import { combineLatest, EMPTY } from 'rxjs';
import { selectActiveListId } from '../list/list.reducer';
import { getGroupsNothingChanged, upsertGroupSuccess } from './group.actions';
import { selectGroupMaxModified } from './group.reducer';
import slugify from 'slugify';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root',
})
export class GroupService2 {
  constructor(private db: AngularFirestore, private store: Store<State>) {}

  getGroups() {
    return combineLatest([
      this.store.select(selectActiveListId),
      this.store.select(selectGroupMaxModified),
    ]).pipe(
      // tap((c) => console.log('groups', c)),
      exhaustMap(([listId, maxModified]) => {
        if (!listId) return EMPTY;
        return this.db
          .collection<Group>(`lists/${listId}/groups`, (ref) =>
            maxModified.getTime() > 0
              ? ref.where('modified', '>', maxModified)
              : ref
          )
          .stateChanges()
          .pipe(
            // tap((c) => console.log('group stateChanges', c)),
            mergeMap((changes) => (changes.length ? changes : [null])),
            // filter(change => !(change && change.payload.doc.metadata.fromCache)),
            // tap((c) => console.log(c)),
            map((change) => {
              if (!change) return getGroupsNothingChanged();
              const group = this.extractGroup(change);
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertGroupSuccess({ group, listId });
                case 'removed':
                  console.error('group remove not implemented!');
                  return upsertGroupSuccess({ group, listId });
              }
            })
          );
      })
    );
  }

  // addList(list: List) {
  //   const user = takeValue(this.auth.user);
  //   if (!user) {
  //     throw new Error('Unexpected error while creating new list');
  //   }
  //   const finalList = {
  //     ...list,
  //     acl: { [user.uid]: true },
  //     modified: firebase.default.firestore.FieldValue.serverTimestamp()
  //   };
  //   return this.db.collection('lists').add(finalList);
  // }

  addGroup(group: Group, listId: string) {
    const { id, ...others } = group;
    const slug = slugify(group.name, { lower: true });
    return this.db.doc(`lists/${listId}/groups/${slug}`).set({
      ...others,
      modified: firebase.default.firestore.FieldValue.serverTimestamp(),
    });
  }
  // removeList(list: List) {
  //   console.log(list);
  //   return this.db.doc('lists/' + list.id).delete();
  // }

  private extractGroup(change: DocumentChangeAction<Group>) {
    const data = change.payload.doc.data();
    const id = change.payload.doc.id;
    const modified =
      (data.modified && (data.modified as any).toDate()) || new Date(0);
    const group = { ...data, id, modified } as Group;
    return group;
  }
}
