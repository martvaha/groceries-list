import { ListKeyManager } from '@angular/cdk/a11y';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
  viewChildren,
} from '@angular/core';
import { SearchItemHighlightDirective } from './search-item-highlight.directive';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, from, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, map, startWith, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { DialogService } from '../../shared/dialog-service/dialog.service';
import { GroupWithItems, Item } from '../../shared/models';
import { SearchService } from '../../shared/search.service';
import { highlight, takeValue } from '../../shared/utils';
import { selectOrderedGroupedItems, State } from '../../state/app.reducer';
import { setGroupId } from '../../state/item/item.actions';
import { selectAllInactiveItems, selectAllItems } from '../../state/item/item.reducer';
import { upsertGroupsOrder } from '../../state/list/list.actions';
import { selectActiveListId, selectListStateLoading } from '../../state/list/list.reducer';
import { ListService } from '../list.service';
import { LongPressDirective } from '../../shared/long-press.directive';

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
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    RouterLink,
    ReactiveFormsModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    LongPressDirective,
    SearchItemHighlightDirective,
  ],
  selector: 'app-list-container',
  templateUrl: './list-container.component.html',
  styleUrls: ['./list-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListContainerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private listService = inject(ListService);
  private snackBar = inject(MatSnackBar);
  private store = inject<Store<State>>(Store);
  private search = inject(SearchService);
  private dialog = inject(DialogService);

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
  readonly searchItems = viewChildren(SearchItemHighlightDirective);
  keyboardEventsManager!: ListKeyManager<SearchItemHighlightDirective>;
  private filteredItemsCache: Item[] = [];
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

  constructor() {
    effect(() => {
      const items = this.searchItems();
      if (items.length) {
        this.keyboardEventsManager = new ListKeyManager(items).withWrap();
        // Subscribe to change events to apply active/inactive styles
        this.keyboardEventsManager.change.subscribe((activeIndex) => {
          items.forEach((item, index) => {
            if (index === activeIndex) {
              item.setActiveStyles();
            } else {
              item.setInactiveStyles();
            }
          });
        });
      }
    });
  }

  ngOnInit() {
    this.loading$ = this.store.select(selectListStateLoading);
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
      map((input: string | { name: string }) => (typeof input === 'string' ? input : input.name)),
    );

    const unselected$ = this.items$.pipe(
      map((items) => items.filter((item) => !item.active)),
      map((items) => {
        this.search.setCollection(items, this.searchOptions);

        return { items };
      }),
    );

    this.filteredItems$ = combineLatest([search$, unselected$]).pipe(
      switchMap(([search, { items }]) => {
        if (items && search.length) {
          return from(this.search.search<Item>(search)).pipe(
            map((matches) =>
              matches?.map((match) => ({
                ...match.item,
                displayName: highlight(match.item.name, match?.matches?.[0]?.indices as unknown as number[][]),
              })),
            ),
          );
        } else {
          return of(items.map((item) => ({ ...item, displayName: item.name })));
        }
      }),
    );

    // Cache filtered items for keyboard selection
    this.filteredItems$.subscribe((items) => {
      this.filteredItemsCache = items ?? [];
    });

    // Reset active item when user types
    this.inputControl.valueChanges.subscribe(() => {
      this.keyboardEventsManager?.setActiveItem(-1);
    });
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

  handleKeyDown(event: KeyboardEvent) {
    if (!this.keyboardEventsManager) return;

    const items = this.searchItems();
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (
        this.keyboardEventsManager.activeItemIndex === null ||
        this.keyboardEventsManager.activeItemIndex === -1
      ) {
        this.keyboardEventsManager.setFirstItemActive();
      } else {
        this.keyboardEventsManager.onKeydown(event);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (
        this.keyboardEventsManager.activeItemIndex === null ||
        this.keyboardEventsManager.activeItemIndex === -1
      ) {
        this.keyboardEventsManager.setLastItemActive();
      } else {
        this.keyboardEventsManager.onKeydown(event);
      }
    } else if (
      event.key === 'Enter' &&
      this.keyboardEventsManager.activeItemIndex !== null &&
      this.keyboardEventsManager.activeItemIndex >= 0
    ) {
      event.preventDefault();
      const activeIndex = this.keyboardEventsManager.activeItemIndex;
      const item = this.filteredItemsCache[activeIndex];
      if (item) {
        this.addItem(item);
      }
    }
  }

  addItem(item: Item) {
    console.log('add object', item);
    this.listId.pipe(take(1)).subscribe((listId) => {
      // mark description as undefined
      // TODO: make separate button to edit description before adding item as todo
      this.listService.markItemTodo(listId, { ...item, description: null });
    });
    this.inputControl.reset('', { emitEvent: true });
  }

  markDone(item: Item) {
    // Add delay so animation has time to finish
    this.listId.pipe(delay(300)).subscribe((listId) => {
      this.listService.markItemDone(listId, item);
      const snackBarRef = this.snackBar.open($localize`${item.name} done!`, $localize`Revert`, {
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
    const item = event.item.data as unknown as Item;
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
