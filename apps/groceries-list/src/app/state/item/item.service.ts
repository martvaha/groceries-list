import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, where, collectionChanges, doc, updateDoc, deleteDoc, serverTimestamp, DocumentChange } from '@angular/fire/firestore';
import { map, tap, mergeMap, switchMap, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { State } from '../app.reducer';
import { combineLatest, EMPTY, of } from 'rxjs';
import { selectActiveListId } from '../list/list.reducer';
import { deleteItemSuccess, getItemsFail, getItemsNothingChanged, upsertItemListSuccess } from './item.actions';
import { Item } from '../../shared/models';
import { selectItemLastUpdated } from './item.reducer';
import { captureException } from '../../shared/sentry';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  constructor(private store: Store<State>) {}

  getItems() {
    return combineLatest([this.store.select(selectActiveListId), this.store.select(selectItemLastUpdated)]).pipe(
      tap((c) => console.log('items', c)),
      switchMap(([listId, maxModified]) => {
        if (!listId) return EMPTY;
        return runInInjectionContext(this.injector, () => {
          const itemCollection = collection(this.firestore, `lists/${listId}/items`);
          const itemQuery = (maxModified?.getTime() ?? 0) > 0 
            ? query(itemCollection, where('modified', '>', maxModified))
            : query(itemCollection);

          return collectionChanges(itemQuery).pipe(
            mergeMap((changes) => {
              if (!changes?.length) return [null];

              const groupedChanges: Record<string, DocumentChange<any>[]> = {
                added: [],
                modified: [],
                removed: [],
              };

              for (const change of changes) {
                groupedChanges[change.type].push(change);
              }

              return Object.keys(groupedChanges)
                .filter((key) => groupedChanges[key]?.length)
                .map((key) => ({ type: key, payload: groupedChanges[key] }));
            }),
            map((change) => {
              if (!change) return getItemsNothingChanged();
              
              const payload = Array.isArray(change.payload) ? change.payload : [change.payload];

              console.log('####', change.type, this.extractItem(payload[0]));
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertItemListSuccess({ listId, items: payload.map((data) => this.extractItem(data)) });

                case 'removed':
                  console.error('item remove not implemented!');
                  return deleteItemSuccess({ listId, item: payload.map((data) => this.extractItem(data)) });
                default:
                  return getItemsNothingChanged();
              }
            }),
            catchError((error: any) => {
              captureException(error);
              return of(getItemsFail({ error }));
            })
          );
        });
      })
    );
  }

  updateItem(item: Item, listId: string) {
    console.log(item);
    const { id, ...others } = item;
    return runInInjectionContext(this.injector, () => {
      const itemDoc = doc(this.firestore, `/lists/${listId}/items/${id}`);
      return updateDoc(itemDoc, {
        ...others,
        modified: serverTimestamp(),
      })
      .catch((reason) => captureException(reason));
    });
  }

  deleteItem(item: Item, listId: string) {
    console.log(listId, item);
    return runInInjectionContext(this.injector, () => {
      const itemDoc = doc(this.firestore, `/lists/${listId}/items/${item.id}`);
      return deleteDoc(itemDoc);
    });
  }

  private extractItem(change: DocumentChange<any>) {
    const data = change.doc.data();
    const id = change.doc.id;
    const modified = (data.modified as any)?.toDate() || new Date(0);
    const groupId = data.groupId || 'others';
    const item = { ...data, id, modified, groupId } as Item;
    return item;
  }
}
