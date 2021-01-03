import { ListKeyManager } from '@angular/cdk/a11y';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DOWN_ARROW, ENTER, UP_ARROW } from '@angular/cdk/keycodes';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, from, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, map, startWith, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { GroupWithItems, Item } from '../../shared/models';
import { highlight, takeValue } from '../../shared/utils';
import { selectOrderedGroupedItems, State } from '../../state/app.reducer';
import { getGroups } from '../../state/group/group.actions';
import { getItems, setGroupId } from '../../state/item/item.actions';
import { selectAllInactiveItems, selectAllItems } from '../../state/item/item.reducer';
import { upsertGroupsOrder } from '../../state/list/list.actions';
import { selectActiveListId, selectListStateLoading } from '../../state/list/list.reducer';
import { ListService } from '../list.service';
import { SearchService } from '../../shared/search.service';
import { DialogService } from '../../shared/dialog-service/dialog.service';

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

@Component({
  selector: 'app-list-container',
  templateUrl: './list-container.component.html',
  styleUrls: ['./list-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListContainerComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$: Subject<void> | undefined = new Subject<void>();
  loading$!: Observable<boolean>;
  groupsWithItems$!: Observable<GroupWithItems[]>;
  dragging = false;
  listId!: Observable<string>;
  filteredItems$!: Observable<Item[] | undefined>;
  inputControl!: FormControl;
  inputForm!: FormGroup;
  items$!: Observable<Item[]>;
  inactiveItems$!: Observable<Item[]>;
  dragDelay = 300;
  draggingGroupId!: string | null;
  @ViewChildren('searchItem') searchItems!: QueryList<any>;
  keyboardEventsManager!: ListKeyManager<any>;
  private searchOptions = {
    keys: ['name'],
    includeMatches: true,
    threshold: 0.6,
  };

  inputValid: ErrorStateMatcher = {
    isErrorState: (control: FormControl) => {
      return control && !control.pristine && !control.valid;
    },
  };

  constructor(
    private route: ActivatedRoute,
    private listService: ListService,
    private snackBar: MatSnackBar,
    private store: Store<State>,
    private search: SearchService,
    private dialog: DialogService
  ) {}

  ngAfterViewInit(): void {
    console.log('3240');
    // this.searchItems.changes.subscribe((items) => (this.keyboardEventsManager = new ListKeyManager(this.searchItems)));
  }

  ngOnInit() {
    this.loading$ = this.store.select(selectListStateLoading);
    this.store.dispatch(getGroups());
    this.store.dispatch(getItems());
    this.items$ = this.store.select(selectAllItems);
    this.inactiveItems$ = this.store.select(selectAllInactiveItems);
    this.groupsWithItems$ = this.store.select(selectOrderedGroupedItems);

    this.inputControl = new FormControl('', [Validators.required]);
    this.inputForm = new FormGroup({ inputControl: this.inputControl });
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('listId') as string));

    // const activeItems = this.items.pipe(map(items => items.filter(item => item.active)));

    const search$ = this.inputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((input: string | { name: string }) => (typeof input === 'string' ? input : input.name))
    );

    const unselected$ = this.items$.pipe(
      map((items) => items.filter((item) => !item.active)),
      map((items) => {
        this.search.setCollection(items, this.searchOptions);

        return { items };
      })
    );

    this.filteredItems$ = combineLatest([search$, unselected$]).pipe(
      switchMap(([search, { items }]) => {
        if (items && search.length) {
          return from(this.search.search<Item>(search)).pipe(
            map((matches) =>
              matches?.map((match) => ({
                ...match.item,
                displayName: highlight(match.item.name, (match?.matches?.[0]?.indices as unknown) as number[][]),
              }))
            )
          );
        } else {
          return of(items.map((item) => ({ ...item, displayName: item.name })));
        }
      })
      // tap(items => (this.keyboardEventsManager = new ListKeyManager(this.searchItems)))
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

  addItemFromInput() {
    const { valid, value } = this.inputControl;
    if (valid && typeof value === 'string') {
      const trimmedValue = value.trim();
      this.listId.pipe(withLatestFrom(this.items$), take(1)).subscribe(([listId, items]) => {
        const existingValue = items.find((item) => item.name === trimmedValue);
        existingValue
          ? this.listService.markItemDone(listId, existingValue)
          : this.listService.addNewItem(listId, trimmedValue);
      });
      this.inputControl.reset('', { emitEvent: true });
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    event.stopImmediatePropagation();
    if (this.keyboardEventsManager) {
      console.log(event.key);
      if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
        // passing the event to key manager so we get a change fired
        this.keyboardEventsManager.onKeydown(event);
      } else if (event.keyCode === ENTER) {
        // when we hit enter, the keyboardManager should call the selectItem method of the `ListItemComponent`
        this.keyboardEventsManager.activeItem.selectItem();
      }
    }
  }

  addItem(item: Item) {
    console.log('add object', item);
    this.listId.pipe(take(1)).subscribe((listId) => {
      this.listService.markItemTodo(listId, item);
    });
    this.inputControl.reset('', { emitEvent: true });
  }

  markDone(item: Item) {
    // Add delay so animation has time to finish
    this.listId.pipe(delay(300)).subscribe((listId) => {
      this.listService.markItemDone(listId, item);
      const snackBarRef = this.snackBar.open(`${item.name} done!`, 'Revert', {
        duration: 5000,
      });
      snackBarRef.afterDismissed().subscribe((data) => {
        if (data.dismissedByAction) {
          this.listService.markItemTodo(listId, item);
        }
      });
    });
  }

  /**
   * TODO: Not good solution!
   * Currently only available if there are less than 40 inactive items.
   * Should be refactored as function so parallel updates are not affected
   * by users network connection etc.
   * @param inactiveItems All inactive items
   */
  markAllActive(inactiveItems: Item[]) {
    if (!inactiveItems.length) {
      this.snackBar.open($localize`No inactive items left!`, $localize`:confirm|:OK`);
      return;
    }

    const dialogRef = this.dialog.confirm({
      data: { title: $localize`Mark all active`, message: $localize`Are you sure you want to reactivate all items?` },
    });

    dialogRef.afterClosed().subscribe((response) => {
      if (!response) return;
      const listId = takeValue(this.listId);
      Promise.all(inactiveItems.map((item) => this.listService.markItemTodo(listId, item)));
    });
  }

  dragStart(id: string | null) {
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
    const groupsOrder = event.container.data.map((group) => group.id);
    moveItemInArray(groupsOrder, event.previousIndex, event.currentIndex);
    this.store.dispatch(upsertGroupsOrder({ groupsOrder, id }));
  }

  inputDisplay(item?: Item): string | undefined {
    return item ? item.name : undefined;
  }

  trackById(index: number, item: { id?: string }) {
    return item?.id;
  }

  ngOnDestroy(): void {
    this.destroy$?.next();
    this.destroy$?.complete();
    delete this.destroy$;
  }
}
