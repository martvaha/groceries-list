import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChange } from '@angular/fire/firestore';
import { map, tap, mergeMap, exhaustMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { State } from '../app.reducer';
import * as firebase from 'firebase/app';
import { combineLatest, EMPTY } from 'rxjs';
import { selectActiveListId } from '../list/list.reducer';
import { deleteItemSuccess, getItemsNothingChanged, upsertItemListSuccess } from './item.actions';
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
            mergeMap((changes) => {
              if (!changes?.length) return [null];

              const groupedChanges: Record<string, DocumentChange<Item>[]> = {
                added: [],
                modified: [],
                removed: [],
              };

              for (const change of changes) {
                groupedChanges[change.type].push(change.payload);
              }

              // Returns list of changes with grouped changesš
              // [{type: 'added', payload: [{}, {},...]}, {type: 'removed', ...}]
              return Object.keys(groupedChanges)
                .filter((key) => groupedChanges[key]?.length)
                .map((key) => ({ type: key, payload: groupedChanges[key] }));
            }),
            map((change) => {
              if (!change) return getItemsNothingChanged();
              if (!Array.isArray(change.payload)) change.payload = [change.payload];

              console.log('####', change.type, this.extractItem(change.payload[0]));
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertItemListSuccess({ listId, items: change.payload.map((data) => this.extractItem(data)) });

                case 'removed':
                  console.error('item remove not implemented!');
                  return deleteItemSuccess({ listId, item: change.payload.map((data) => this.extractItem(data)) });
                default:
                  return getItemsNothingChanged();
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

  private extractItem(payload: DocumentChange<Item>) {
    const data = payload.doc.data();
    const id = payload.doc.id;
    const modified = (data.modified as any)?.toDate() || new Date(0);
    const groupId = data.groupId || 'others';
    const group = { ...data, id, modified, groupId } as Item;
    return group;
  }
}
