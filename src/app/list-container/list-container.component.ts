import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, combineLatest, BehaviorSubject, Subject, of } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { switchMap, map, debounceTime, startWith, delay, tap, take, withLatestFrom, takeUntil } from 'rxjs/operators';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, CdkDrag } from '@angular/cdk/drag-drop';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../shared/loading-service';
import { highlight, takeValue } from '../shared/utils';
import * as Fuse from 'fuse.js';
import { Item, Group } from '../shared/models';
import * as firebase from 'firebase/app';
import { LinkedList } from '../shared/linked-list';
import { Store } from '@ngrx/store';
import { State, selectOrderedGroupedItems } from '../state/app.reducer';
import { getGroups } from '../state/group/group.actions';
import { selectAllGroups } from '../state/group/group.reducer';
import { getItems, setGroupId } from '../state/item/item.actions';
import { selectAllItems } from '../state/item/item.reducer';
import { selectActiveListId } from '../state/list/list.reducer';
import { upsertGroupsOrder } from '../state/list/list.actions';

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
  private destroy$ = new Subject<any>();
  groupsWithItems$: Observable<GroupWithItems[]>;
  dragging = false;
  listId: Observable<string>;
  activeGroups: Observable<LinkedList<GroupWithItems>>;
  filteredItems$: Observable<Item[]>;
  inputControl: FormControl;
  inputForm: FormGroup;
  private fuse: Fuse<Item>;
  items: Observable<Item[]>;
  dragDelay = 300;
  draggingGroupId: string | null;

  inputValid: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      return control && !control.pristine && !control.valid;
    }
  };

  constructor(
    private route: ActivatedRoute,
    private db: AngularFirestore,
    private loading: LoadingService,
    private snackBar: MatSnackBar,
    private store: Store<State>
  ) {}

  ngOnInit() {
    this.store.dispatch(getGroups());
    this.store.dispatch(getItems());
    this.items = this.store.select(selectAllItems);
    this.groupsWithItems$ = this.store.select(selectOrderedGroupedItems);

    this.fuse = new Fuse<Item>([], {
      keys: ['name'],
      includeMatches: true,
      threshold: 0.6
    });
    this.inputControl = new FormControl('', [Validators.required]);
    this.inputForm = new FormGroup({ inputControl: this.inputControl });
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('listId') as string));

    // const activeItems = this.items.pipe(map(items => items.filter(item => item.active)));

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
          this.db.doc(path).update({ active: true, modified: firebase.firestore.FieldValue.serverTimestamp() });
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
              ? this.db
                  .doc('lists/' + listId + '/items/' + existingValue.id)
                  .update({ active: true, modified: firebase.firestore.FieldValue.serverTimestamp() })
              : this.db.collection('lists/' + listId + '/items').add({
                  name: trimmedValue,
                  active: true,
                  modified: firebase.firestore.FieldValue.serverTimestamp()
                });
          });
      }
      this.inputControl.reset('', { emitEvent: true });
    }
  }

  markDone(item: Item) {
    this.listId.pipe(delay(300)).subscribe(listId => {
      const path = 'lists/' + listId + '/items/' + item.id;
      this.db.doc(path).update({ active: false, modified: firebase.firestore.FieldValue.serverTimestamp() });
      const snackBarRef = this.snackBar.open(`${item.name} ostetud!`, 'Taasta', { duration: 5000 });
      snackBarRef.afterDismissed().subscribe(data => {
        if (data.dismissedByAction) {
          this.db.doc(path).update({ active: true, modified: firebase.firestore.FieldValue.serverTimestamp() });
        }
      });
    });
  }

  dragStart(id: string | null) {
    this.draggingGroupId = id;
  }

  drop(event: CdkDragDrop<string>) {
    if (event.previousIndex === event.currentIndex) return;
    const listId = takeValue(this.store.select(selectActiveListId));
    if (!listId) return;
    const item = (event.item.data as unknown) as Item;
    const groupId = event.container.id;
    this.store.dispatch(setGroupId({ item, groupId, listId }));
  }

  dropGroup(event: CdkDragDrop<GroupWithItems[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const id = takeValue(this.store.select(selectActiveListId));
    if (!id) return;
    const groupsOrder = event.container.data.map(group => group.id);
    moveItemInArray(groupsOrder, event.previousIndex, event.currentIndex);
    this.store.dispatch(upsertGroupsOrder({ groupsOrder, id }));
  }

  inputDisplay(item?: Item): string | undefined {
    return item ? item.name : undefined;
  }

  trackById(index: number, item: Item) {
    return item ? item.id : undefined;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    delete this.destroy$;
  }
}
