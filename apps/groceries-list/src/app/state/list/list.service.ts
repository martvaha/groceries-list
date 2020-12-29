import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import firebase from 'firebase/app';
import { combineLatest, EMPTY } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { List } from '../../shared/models';
import { takeValue } from '../../shared/utils';
import { State } from '../app.reducer';
import { selectUser } from '../user/user.reducer';
import { loadListsNothingChanged, removeListSuccess, upsertListSuccess } from './list.actions';
import { selectListMaxModified } from './list.reducer';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  constructor(private db: AngularFirestore, private auth: AuthService, private store: Store<State>) {}

  getLists() {
    return combineLatest([
      this.store.select(selectUser),
      // Only update maxModified every 1 seconds to give time for local store update
      this.store
        .select(selectListMaxModified)
        .pipe(
          debounceTime(1000),
          startWith(takeValue(this.store.select(selectListMaxModified))),
          distinctUntilChanged()
        ),
    ]).pipe(
      tap((c) => console.log('get lists input change', c)),
      switchMap(([user, maxModified]) => {
        if (!user) return EMPTY;
        return this.db
          .collection<List>('lists', (ref) =>
            ref.where('acl', 'array-contains', user.uid).where('modified', '>', maxModified)
          )
          .stateChanges()
          .pipe(
            tap((c) => console.log('get lists unfiltered', c)),
            mergeMap((changes) => (changes.length ? changes : [null])),
            // filter(change => !(change && change.payload.doc.metadata.fromCache)),
            tap((c) => console.log(c)),
            map((change) => {
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
    const user = takeValue(this.store.select(selectUser));
    if (!user) throw new Error('Unexpected error while creating new list');
    const finalList = {
      ...list,
      acl: [user.uid],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modified: firebase.firestore.FieldValue.serverTimestamp() as any,
    } as List;
    return this.db.collection('lists').add(finalList);
  }

  updateList(list: List) {
    const { id, ...others } = list;
    return this.db.doc(`/lists/${id}`).update({
      ...others,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modified: firebase.firestore.FieldValue.serverTimestamp() as any,
    } as List);
  }

  removeList(list: List) {
    console.log(list);
    return this.db.doc('lists/' + list.id).delete();
  }

  private extractList(change: DocumentChangeAction<List>) {
    const data = change.payload.doc.data();
    const id = change.payload.doc.id;
    const modified = (data?.modified as any)?.toDate() || new Date(0);
    const shared = data.acl?.length > 1;
    const list = { ...data, id, modified, shared } as List;
    return list;
  }
}
