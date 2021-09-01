import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChange } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import * as firebase from 'firebase/app';
import { combineLatest, EMPTY } from 'rxjs';
import { exhaustMap, map, mergeMap } from 'rxjs/operators';
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
  constructor(private db: AngularFirestore, private store: Store<State>) {}

  getGroups() {
    return combineLatest([this.store.select(selectActiveListId), this.store.select(selectGroupLastUpdated)]).pipe(
      // tap((c) => console.log('groups', c)),
      exhaustMap(([listId, maxModified]) => {
        if (!listId) return EMPTY;
        return this.db
          .collection<Group>(`lists/${listId}/groups`, (ref) =>
            maxModified.getTime() > 0 ? ref.where('modified', '>', maxModified) : ref
          )
          .stateChanges()
          .pipe(
            mergeMap((changes) => {
              if (!changes?.length) return [null];

              const groupedChanges: Record<string, DocumentChange<Group>[]> = {
                added: [],
                modified: [],
                removed: [],
              };

              for (const change of changes) {
                groupedChanges[change.type].push(change.payload);
              }

              // Returns list of changes with grouped changes
              // [{type: 'added', payload: [{}, {},...]}, {type: 'removed', ...}]
              return Object.keys(groupedChanges)
                .filter((key) => groupedChanges[key]?.length)
                .map((key) => ({ type: key, payload: groupedChanges[key] }));
            }),
            map((change) => {
              if (!change) return getGroupsNothingChanged();
              if (!Array.isArray(change.payload)) change.payload = [change.payload];

              console.log('####', change.type, this.extractGroup(change.payload[0]));
              switch (change.type) {
                case 'added':
                case 'modified':
                  return upsertGroupsSuccess({ listId, groups: change.payload.map((data) => this.extractGroup(data)) });

                case 'removed':
                  console.error('group remove not implemented!');
                  return getGroupsNothingChanged();
                default:
                  return getGroupsNothingChanged();
              }
            })
          );
      })
    );
  }

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

  private extractGroup(payload: DocumentChange<Group>) {
    const data = payload.doc.data();
    const id = payload.doc.id;
    const modified = (data.modified && (data.modified as any).toDate()) || new Date(0);
    const group = { ...data, id, modified } as Group;
    return group;
  }
}
