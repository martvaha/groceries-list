import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, combineLatest, BehaviorSubject, Subject, of } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { switchMap, map, debounceTime, startWith, delay, tap, take, withLatestFrom, takeUntil } from 'rxjs/operators';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../shared/loading-service';
import { highlight, takeValue } from '../shared/utils';
import * as Fuse from 'fuse.js';
import { Item, Group } from '../shared/models';
import { GroupService } from '../shared/group.service';
import * as firebase from 'firebase/app';
import { LinkedList } from '../shared/linked-list';

export interface FuseMatch {
  indices: [number, number][];
  value: string;
  key: string;
  arrayIndex: number;
}

export interface FuseAdvancedResult<T> {
  item: T;
  matches: FuseMatch[];
}

export interface GroupWithItems extends Group {
  items: Item[];
}

@Component({
  selector: 'gl-list-container',
  templateUrl: './list-container.component.html',
  styleUrls: ['./list-container.component.scss']
})
export class ListContainerComponent implements OnInit, OnDestroy {
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  private destroy$ = new Subject<any>();

  public dragging = false;
  public listId: Observable<string>;
  public activeGroups: Observable<LinkedList<GroupWithItems>>;
  public filteredItems$: Observable<Item[]>;
  public inputControl: FormControl;
  public inputForm: FormGroup;
  private fuse: Fuse<Item>;
  public items = this.itemsSubject.asObservable();

  public inputValid: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      return !control.pristine && !control.valid;
    }
  };

  constructor(
    private route: ActivatedRoute,
    private db: AngularFirestore,
    private loading: LoadingService,
    private snackBar: MatSnackBar,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    const activeGroups = new LinkedList<GroupWithItems>();
    // activeGroups.addNode({
    //   name: 'Group 1',
    //   active: true,
    //   id: '1',
    //   modified: new Date(),
    //   items: [
    //     { id: '1', name: 'Item 1', modified: new Date(), active: true, groupId: '1' },
    //     { id: '4', name: 'Item 4', modified: new Date(), active: true, groupId: '1' },
    //     { id: '2', name: 'Item 2', modified: new Date(), active: true, groupId: '1' }
    //   ]
    // });
    // activeGroups.addNode({
    //   name: 'Group 3',
    //   id: '3',
    //   modified: new Date(),
    //   active: true,
    //   items: [
    //     { id: '5', name: 'Item 5', modified: new Date(), active: true, groupId: '3' },
    //     { id: '6', name: 'Item 6', modified: new Date(), active: true, groupId: '3' },
    //     { id: '7', name: 'Item 7', modified: new Date(), active: true, groupId: '3' }
    //   ]
    // });
    // activeGroups.addNode({
    //   active: false,
    //   name: 'Group 2',
    //   id: '2',
    //   modified: new Date(),
    //   items: [{ id: '3', name: 'Item 3', modified: new Date(), active: true, groupId: '2' }]
    // });
    // activeGroups.addNode({
    //   active: true,
    //   name: 'Group 5',
    //   id: '5',
    //   modified: new Date(),
    //   items: [{ id: '9', name: 'Item 2424', modified: new Date(), active: true, groupId: '5' }]
    // });

    this.loading.start();
    this.fuse = new Fuse<Item>([], {
      keys: ['name'],
      includeMatches: true,
      threshold: 0.6
    });
    this.inputControl = new FormControl('', [Validators.required]);
    this.inputForm = new FormGroup({ inputControl: this.inputControl });
    this.listId = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id') as string),
      tap(id => this.groupService.setListId(id))
    );
    this.listId
      .pipe(
        switchMap(listId => {
          const path = 'lists/' + listId + '/items';
          return this.db
            .collection<Item>(path, ref => ref.orderBy('name'))
            .snapshotChanges()
            .pipe(
              map(items =>
                items.map(item => {
                  const data = item.payload.doc.data();
                  const id = item.payload.doc.id;
                  return { id, ...data } as Item;
                })
              ),
              tap(d => console.log(d)),
              takeUntil(this.destroy$)
            );
        })
      )
      .subscribe(items => this.itemsSubject.next(items));

    this.items.pipe(take(1)).subscribe(() => this.loading.end());

    const activeItems = this.items.pipe(map(items => items.filter(item => item.active)));

    const activeGroupsMap = activeItems.pipe(
      map(items => {
        const itemsMap = {} as { [key: string]: GroupWithItems };
        items.forEach(item => {
          const id = item.groupId || 'others';
          if (itemsMap[id]) {
            itemsMap[id].items.push(item);
          } else {
            itemsMap[id] = { id: id, items: [item] } as GroupWithItems;
          }
        });
        return itemsMap;
      })
    );

    this.activeGroups = combineLatest(this.groupService.groups, activeGroupsMap).pipe(
      map(([groups, groupsMap]) => {
        if (!groups || !groupsMap) return new LinkedList<GroupWithItems>();

        // If group is removed for some reason, display items under 'others' group
        const groupIds = new Set<string>();
        for (const group of groups) {
          groupIds.add(group.id);
        }
        const unknownGroupIds = Object.keys(groupsMap).filter(groupId => !groupIds.has(groupId));

        unknownGroupIds.forEach(groupId => {
          const group = groupsMap[groupId];
          delete groupsMap[groupId];
          if (groupsMap['others']) {
            groupsMap['others'].items.push(...group.items);
          } else {
            groupsMap['others'] = {
              id: 'others',
              items: group.items
            } as GroupWithItems;
          }
        });

        for (const group of groups) {
          (group as GroupWithItems).items = groupsMap[group.id].items;
        }
        return groups as LinkedList<GroupWithItems>;
      }),
      tap(data => console.log(data))
    );

    const search$ = this.inputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((input: string | { name: string }) => (typeof input === 'string' ? input : input.name))
    );

    const unselected$ = this.items.pipe(
      map(items => items.filter(item => !item.active)),
      map(items => {
        this.fuse.setCollection(items);
        return { items, fuse: this.fuse };
      })
    );

    this.filteredItems$ = combineLatest(search$, unselected$).pipe(
      map(([search, { items, fuse }]) =>
        fuse && search.length
          ? fuse.search(search).map((match: any) => ({
              ...match.item,
              displayName: highlight(match.item.name, match.matches[0].indices)
            }))
          : items.map(item => ({ ...item, displayName: item.name }))
      )
    );
  }

  getConnectedGroups(id: string, groups: GroupWithItems[]) {
    const groupIds: string[] = [];
    for (const group of groups) {
      if (group.id === id) continue;
      groupIds.push(group.id);
    }
    return groupIds;
  }

  addItem() {
    const { valid, value } = this.inputControl;
    if (valid && value) {
      if (typeof value === 'object' && 'id' in value) {
        console.log('add object', value);
        this.listId.pipe(take(1)).subscribe(listId => {
          const path = 'lists/' + listId + '/items/' + value.id;
          this.db.doc(path).update({ active: true });
        });
      } else if (typeof value === 'string') {
        console.log('add string', `"${value}"`);
        const trimmedValue = value.trim();
        this.listId
          .pipe(
            withLatestFrom(this.items),
            take(1)
          )
          .subscribe(([listId, items]) => {
            const existingValue = items.find(item => item.name === trimmedValue);
            console.log(existingValue);
            existingValue
              ? this.db.doc('lists/' + listId + '/items/' + existingValue.id).update({ active: true })
              : this.db.collection('lists/' + listId + '/items').add({ name: trimmedValue, active: true });
          });
      }
      this.inputControl.reset('', { emitEvent: true });
    }
  }

  markDone(item: Item) {
    this.listId.pipe(delay(300)).subscribe(listId => {
      const path = 'lists/' + listId + '/items/' + item.id;
      this.db.doc(path).update({ active: false });
      const snackBarRef = this.snackBar.open(`${item.name} ostetud!`, 'Taasta', { duration: 5000 });
      snackBarRef.afterDismissed().subscribe(data => {
        if (data.dismissedByAction) {
          this.db.doc(path).update({ active: true });
        }
      });
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    console.log('item');
    console.log(event);
    this.activeGroups.subscribe(data => {
      // data.setNodeNext()
    });
  }

  dropGroup(event: CdkDragDrop<LinkedList<GroupWithItems>>) {
    console.log('group');
    console.log(event);
    if (event.currentIndex === event.previousIndex) return;
    const linkedList = event.container.data;
    const node = linkedList.getNodeAt(event.previousIndex);
    const newNode = linkedList.getNodeAt(event.currentIndex);
    if (node === undefined || newNode === undefined) throw new Error('node cannot be undefined');
    const changes =
      event.previousIndex > event.currentIndex
        ? linkedList.setNodeNext(node, newNode)
        : linkedList.setNodeNext(newNode, node);
    console.log(changes);

    const listId = takeValue(this.listId);
    const batch = this.db.firestore.batch();

    for (const change of changes) {
      const { items, ...group } = change.data;
      batch.set(this.db.doc(`lists/${listId}/groups/${group.id}`).ref, {
        ...group,
        nextId: change.next ? change.next.data.id : null,
        modified: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    batch.commit();
  }

  inputDisplay(item?: Item): string | undefined {
    return item ? item.name : undefined;
  }

  trackById(index: number, item: Item) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    delete this.destroy$;
  }
}
