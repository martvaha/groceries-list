import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { map, tap, mergeMap, exhaustMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { State } from '../app.reducer';
import * as firebase from 'firebase/app';
import { combineLatest, empty, of, EMPTY } from 'rxjs';
import { selectActiveListId } from '../list/list.reducer';
import { getItemsNothingChanged, upsertItemSuccess } from './item.actions';
import { Item } from '../../shared/models';
import { selectItemMaxModified } from './item.reducer';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  constructor(private db: AngularFirestore, private store: Store<State>) {}

  getItems() {
    return combineLatest([this.store.select(selectActiveListId), this.store.select(selectItemMaxModified)]).pipe(
      tap((c) => console.log('items', c)),
      exhaustMap(([listId, maxModified]) => {
        if (!listId) return EMPTY;
        return this.db
          .collection<Item>(`lists/${listId}/items`, (ref) =>
            maxModified.getTime() > 0 ? ref.where('modified', '>', maxModified) : ref
          )
          .stateChanges()
          .pipe(
            tap((c) => console.log('items all changes', c)),
            mergeMap((changes) => (changes.length ? changes : [null])),
            // filter(change => !(change && change.payload.doc.metadata.fromCache)),
            tap((c) => console.log(c)),
            map((change) => {
              if (!change) return getItemsNothingChanged();
              console.log('####', change.type, this.extractItem(change));
              const item = this.extractItem(change);
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertItemSuccess({ item, listId });
                case 'removed':
                  console.error('item remove not implemented!');
                  return upsertItemSuccess({ item, listId });
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

  // removeList(list: List) {
  //   console.log(list);
  //   return this.db.doc('lists/' + list.id).delete();
  // }

  updateItem(item: Item, listId: string) {
    console.log(item);
    const { id, ...others } = item;
    return this.db.doc(`/lists/${listId}/items/${id}`).update({
      ...others,
      modified: firebase.default.firestore.FieldValue.serverTimestamp(),
    });
  }

  deleteItem(item: Item, listId: string) {
    console.log(listId, item);
    return this.db.doc(`/lists/${listId}/items/${item.id}`).delete();
  }

  private extractItem(change: DocumentChangeAction<Item>) {
    const data = change.payload.doc.data();
    const id = change.payload.doc.id;
    const modified = (data.modified && (data.modified as any).toDate()) || new Date(0);
    const groupId = data.groupId || 'others';
    const group = { ...data, id, modified, groupId } as Item;
    console.log(group);
    return group;
  }
}
