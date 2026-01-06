import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, where, collectionChanges, doc, setDoc, serverTimestamp, DocumentChange } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { combineLatest, EMPTY, of } from 'rxjs';
import { switchMap, map, mergeMap, catchError } from 'rxjs/operators';
import slugify from 'slugify';
import { Group } from '../../shared/models';
import { State } from '../app.reducer';
import { selectActiveListId } from '../list/list.reducer';
import { getGroupsNothingChanged, upsertGroupsSuccess } from './group.actions';
import { selectGroupLastUpdated } from './group.reducer';

@Injectable({
  providedIn: 'root',
})
export class GroupService2 {
  private store = inject<Store<State>>(Store);

  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  getGroups() {
    return combineLatest([this.store.select(selectActiveListId), this.store.select(selectGroupLastUpdated)]).pipe(
      switchMap(([listId, maxModified]) => {
        if (!listId) return EMPTY;
        return runInInjectionContext(this.injector, () => {
          const groupCollection = collection(this.firestore, `lists/${listId}/groups`);
          const groupQuery = (maxModified?.getTime() ?? 0) > 0 
            ? query(groupCollection, where('modified', '>', maxModified))
            : query(groupCollection);

          return collectionChanges(groupQuery).pipe(
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
              if (!change) return getGroupsNothingChanged();
              
              const payload = Array.isArray(change.payload) ? change.payload : [change.payload];

              console.log('####', change.type, this.extractGroup(payload[0]));
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertGroupsSuccess({ listId, groups: payload.map((data) => this.extractGroup(data)) });

                case 'removed':
                  console.error('group remove not implemented!');
                  return getGroupsNothingChanged();
                default:
                  return getGroupsNothingChanged();
              }
            }),
            catchError((error) => {
              console.error('getGroups error', error);
              return of(getGroupsNothingChanged());
            })
          );
        });
      })
    );
  }

  addGroup(group: Group, listId: string) {
    const { id, ...others } = group;
    const slug = slugify(group.name, { lower: true });
    return runInInjectionContext(this.injector, () => {
      const groupDoc = doc(this.firestore, `lists/${listId}/groups/${slug}`);
      return setDoc(groupDoc, {
        ...others,
        modified: serverTimestamp(),
      });
    });
  }

  private extractGroup(change: DocumentChange<any>) {
    const data = change.doc.data();
    const id = change.doc.id;
    const modified = (data.modified && (data.modified as any).toDate()) || new Date(0);
    const group = { ...data, id, modified } as Group;
    return group;
  }
}
