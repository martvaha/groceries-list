import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { AuthService, User } from '../../auth/auth.service';
import {
  filter,
  switchMap,
  map,
  tap,
  mergeMap,
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
import { selectListMaxModified } from './list.reducer';
import { takeValue } from '../../shared/utils';
import * as firebase from 'firebase/app';
import { selectUser } from '../user/user.reducer';
import { combineLatest, of, EMPTY } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  constructor(private db: AngularFirestore, private auth: AuthService, private store: Store<State>) {}

  getLists() {
    return combineLatest(
      this.store.select(selectUser),
      // Only update maxModified every 1 seconds to give time for local store update
      this.store.select(selectListMaxModified).pipe(
        debounceTime(1000),
        startWith(takeValue(this.store.select(selectListMaxModified))),
        distinctUntilChanged()
      )
    ).pipe(
      tap(c => console.log('get lists input change', c)),
      switchMap(([user, maxModified]) => {
        if (!user) return EMPTY;
        return this.db
          .collection<List>('lists', ref =>
            ref.where('acl.' + user.uid, '==', true).where('modified', '>', maxModified)
          )
          .stateChanges()
          .pipe(
            tap(c => console.log('get lists unfiltered', c)),
            mergeMap(changes => (changes.length ? changes : [null])),
            // filter(change => !(change && change.payload.doc.metadata.fromCache)),
            tap(c => console.log(c)),
            map(change => {
              if (!change) return loadListsNothingChanged();
              const list = this.extractList(change);
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertListSuccess({ list });
                case 'removed':
                  return removeListSuccess({ list });
              }
            })
          );
      })
    );
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

  updateList(list: List) {
    const { id, ...others } = list;
    return this.db
      .doc(`/lists/${id}`)
      .update({ ...others, modified: firebase.firestore.FieldValue.serverTimestamp() });
  }

  removeList(list: List) {
    console.log(list);
    return this.db.doc('lists/' + list.id).delete();
  }

  private extractList(change: DocumentChangeAction<List>) {
    const data = change.payload.doc.data();
    const id = change.payload.doc.id;
    const modified = (data.modified && (data.modified as any).toDate()) || new Date(0);
    const list = { id, ...data, modified } as List;
    return list;
  }
}
