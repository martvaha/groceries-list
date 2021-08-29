import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { Action, Store } from '@ngrx/store';
import firebase from 'firebase/app';
import { combineLatest, EMPTY, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { List } from '../../shared/models';
import { captureException } from '../../shared/sentry';
import { takeValue } from '../../shared/utils';
import { State } from '../app.reducer';
import { selectUser } from '../user/user.reducer';
import { loadListsNothingChanged, removeListSuccess, upsertListSuccess } from './list.actions';
import { selectListLastUpdated } from './list.reducer';

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
        .select(selectListLastUpdated)
        .pipe(
          debounceTime(1000),
          startWith(takeValue(this.store.select(selectListLastUpdated))),
          distinctUntilChanged()
        ),
    ]).pipe(
      switchMap(([user, lastUpdated]) => {
        if (!user) return EMPTY;
        console.log('load list query', { uid: user.uid, lastUpdated });
        return this.db
          .collection<List>('lists', (ref) =>
            ref.where('acl', 'array-contains', user.uid).where('modified', '>', lastUpdated)
          )
          .stateChanges()
          .pipe(
            tap((c) => console.log('load list changes', c)),
            // mergeMap((changes) => (changes.length ? changes : [null])),
            // filter(change => !(change && change.payload.doc.metadata.fromCache)),
            // tap((c) => console.log(c)),
            map((changes) => {
              if (!changes?.length) return [loadListsNothingChanged()];
              const upserted = [];
              const removed = [];
              for (const change of changes) {
                const list = this.extractList(change);
                if (change.type === 'added' || change.type === 'modified') {
                  upserted.push(list);
                } else if (change.type === 'removed') {
                  removed.push(list);
                } else {
                  captureException(new Error('Unknown list change type'));
                }
              }
              const actions: Action[] = [];
              if (upserted.length) actions.push(upsertListSuccess({ lists: upserted }));
              if (removed.length) actions.push(removeListSuccess({ lists: removed }));
              return actions;
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
