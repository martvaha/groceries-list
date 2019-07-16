import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { SharedModule } from './shared.module';
import { AngularFirestore } from '@angular/fire/firestore';
import { switchMap, map, withLatestFrom, takeUntil, filter, tap } from 'rxjs/operators';
import { Group } from './models';
import { BehaviorSubject, Subject } from 'rxjs';
import { LinkedList, LinkedNode } from './linked-list';

@Injectable({
  providedIn: SharedModule
})
export class GroupService implements OnInit, OnDestroy {
  private groupsSubject = new BehaviorSubject<LinkedList<Group> | undefined>(undefined);
  private listIdSubject = new BehaviorSubject<string>('');
  private destroySubject = new Subject();

  public groups = this.groupsSubject.asObservable();

  constructor(private db: AngularFirestore) {
    this.ngOnInit();
  }

  ngOnInit() {
    const unorderedGroups = this.listIdSubject.pipe(
      filter(listId => !!listId),
      switchMap(listId =>
        this.db
          .collection<Group>(`lists/${listId}/groups`)
          .snapshotChanges()
          .pipe(
            map(groups => groups.map(group => ({ id: group.payload.doc.id, ...group.payload.doc.data() } as Group)))
          )
      ),
      tap(t => console.log(t))
    );

    const orderedGroups = unorderedGroups.pipe(
      map(groups => {
        const groupLinks = {} as { string: LinkedNode<Group> };
        groups.forEach(group => {
          groupLinks[group.id] = group;
        });

        groups.forEach(group => {
          (group as any)._next = groupLinks[group.nextId as string] || null;
          delete groupLinks[group.nextId as string];
        });

        const [first] = Object.values(groupLinks);
        const ordered = new LinkedList<Group>();
        (ordered as any)._first = first;
        // let currentGroup: Group = root as any;
        // const ordered = [currentGroup];
        // for (let i = 0; i < groups.length - 1; i++) {
        //   currentGroup = groupLinks[currentGroup.id];
        //   ordered.push(currentGroup);
        // }
        console.log(ordered);
        return ordered;
      })
    );

    orderedGroups.pipe(takeUntil(this.destroySubject)).subscribe(groups => {
      console.log('groups', groups);
      const othersGroup = groups.find(node => node.id === 'others');
      if (othersGroup) {
        groups.addNode({
          id: 'others',
          name: 'Muu',
          modified: new Date(),
          active: true,
          nextId: null
        });
      }
      this.groupsSubject.next(groups);
    });
  }

  setListId(listId: string) {
    if (listId && this.getListId() !== listId) {
      this.listIdSubject.next(listId);
    }
  }

  getListId() {
    return this.listIdSubject.getValue();
  }

  ngOnDestroy() {
    this.destroySubject.next();
    delete this.destroySubject;
  }
}
