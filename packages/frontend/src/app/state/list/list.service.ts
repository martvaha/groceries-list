import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, where, collectionChanges, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, DocumentChange } from '@angular/fire/firestore';
import { Action, Store } from '@ngrx/store';
import { combineLatest, EMPTY, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';
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
  private auth = inject(AuthService);
  private store = inject<Store<State>>(Store);

  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

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
      filter(([user]) => !!user),
      switchMap(([user, lastUpdated]) => {
        console.log('load list query', { uid: user!.uid, lastUpdated });
        return runInInjectionContext(this.injector, () => {
          const listCollection = collection(this.firestore, 'lists');
          const listQuery = (lastUpdated?.getTime() ?? 0) > 0
            ? query(
                listCollection,
                where('acl', 'array-contains', user!.uid),
                where('modified', '>', lastUpdated)
              )
            : query(listCollection, where('acl', 'array-contains', user!.uid));

          return collectionChanges(listQuery).pipe(
            // startWith ensures we emit immediately when query returns no documents
            // (collectionChanges may not emit for empty results with time-based filters)
            startWith([] as DocumentChange<any>[]),
            tap((c) => console.log('load list changes', c)),
            map((changes) => {
              if (!changes?.length) return [loadListsNothingChanged()];
              const upserted: List[] = [];
              const removed: List[] = [];
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
            }),
            catchError((error) => {
              console.error('getLists error', error);
              captureException(error);
              return of([loadListsNothingChanged()]);
            })
          );
        });
      })
    );
  }

  addList(list: List) {
    const user = takeValue(this.store.select(selectUser));
    if (!user) throw new Error('Unexpected error while creating new list');
    const finalList = {
      ...list,
      acl: [user.uid],
      modified: serverTimestamp() as any,
    } as List;
    return runInInjectionContext(this.injector, () => {
      return addDoc(collection(this.firestore, 'lists'), finalList);
    });
  }

  updateList(list: List) {
    const { id, ...others } = list;
    return runInInjectionContext(this.injector, () => {
      const listDoc = doc(this.firestore, `/lists/${id}`);
      return updateDoc(listDoc, {
        ...others,
        modified: serverTimestamp() as any,
      } as any);
    });
  }

  removeList(list: List) {
    console.log(list);
    return runInInjectionContext(this.injector, () => {
      const listDoc = doc(this.firestore, 'lists/' + list.id);
      return deleteDoc(listDoc);
    });
  }

  private extractList(change: DocumentChange<any>) {
    const data = change.doc.data();
    const id = change.doc.id;
    const modified = (data?.modified as any)?.toDate() || new Date(0);
    const shared = (data.acl?.length || 0) > 1;
    const list = { ...data, id, modified, shared } as List;
    return list;
  }
}
