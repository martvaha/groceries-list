import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService, User } from '../../auth/auth.service';
import {
  filter,
  switchMap,
  map,
  tap,
  mergeMap,
  combineLatest,
  take,
  concatMap,
  debounceTime,
  startWith,
  first,
  distinctUntilChanged
} from 'rxjs/operators';
import { List } from '../../shared/models';
import { upsertListSuccess, removeListSuccess, loadListsNothingChanged } from './list.actions';
import { Store } from '@ngrx/store';
import { State } from '../app.reducer';
import { selectListMaxModified } from './lists.reducer';
import { takeValue } from '../../shared/utils';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  constructor(private db: AngularFirestore, private auth: AuthService, private store: Store<State>) {}

  getLists() {
    return this.auth.user.pipe(
      filter(user => !!user),
      map(user => user as User),
      combineLatest(
        // Only update maxModified every 5 seconds to give time for local store update
        this.store.select(selectListMaxModified).pipe(
          debounceTime(5000),
          startWith(takeValue(this.store.select(selectListMaxModified))),
          distinctUntilChanged()
        )
      ),
      tap(c => console.log(c)),
      switchMap(([user, maxModified]) =>
        this.db
          .collection<List>('lists', ref =>
            ref.where('acl.' + user.uid, '==', true).where('modified', '>', maxModified)
          )
          .stateChanges()
          .pipe(
            mergeMap(change => change),
            filter(change => !change.payload.doc.metadata.fromCache),
            tap(c => console.log(c)),
            map(change => {
              const data = change.payload.doc.data();
              const id = change.payload.doc.id;
              const modified = (data.modified && (data.modified as any).toDate()) || new Date(0);
              const list = { id, ...data, modified } as List;
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertListSuccess({ list });
                case 'removed':
                  return removeListSuccess({ list });
              }
            })
          )
      )
    );
  }

  clearListCache() {
    localStorage.removeItem('list');
  }

  addList(list: List) {
    const user = takeValue(this.auth.user);
    if (!user) {
      throw new Error('Unexpected error while creating new list');
    }
    const finalList = {
      ...list,
      acl: { [user.uid]: true },
      modified: firebase.firestore.FieldValue.serverTimestamp()
    };
    return this.db.collection('lists').add(finalList);
  }

  removeList(list: List) {
    console.log(list);
    return this.db.doc('lists/' + list.id).delete();
  }
}
