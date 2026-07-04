import { ListKeyManager } from '@angular/cdk/a11y';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { MediaMatcher } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  effect,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { SearchItemHighlightDirective } from './search-item-highlight.directive';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, formatDate, NgClass } from '@angular/common';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, from, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, map, shareReplay, startWith, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { DialogService } from '../../shared/dialog-service/dialog.service';
import { DurationPipe } from '../../shared/duration.pipe';
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    LongPressDirective,
    SearchItemHighlightDirective,
    DurationPipe,
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
  private media = inject(MediaMatcher);
  private locale = inject(LOCALE_ID);
  private mobileQuery = this.media.matchMedia('(max-width: 600px)');
  private mobileQueryListener = () => this.isMobile.set(this.mobileQuery.matches);
  isMobile = signal(this.mobileQuery.matches);

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
  /** Ticks every minute so the recently-added chips stay fresh. */
  protected readonly now = signal(Date.now());
  private nowTimer?: ReturnType<typeof setInterval>;
  private static readonly maxAgeDays = 9;
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
    this.mobileQuery.addEventListener('change', this.mobileQueryListener);
    this.nowTimer = setInterval(() => this.now.set(Date.now()), 60_000);

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
      distinctUntilChanged(),
      shareReplay(1),
    );

    // Use shareReplay to cache items and avoid re-executing setCollection unnecessarily
    const allItems$ = this.items$.pipe(
      distinctUntilChanged((prev, curr) => prev.length === curr.length && prev.every((p, i) => p.id === curr[i]?.id && p.active === curr[i]?.active)),
      tap((items) => {
        this.search.setCollection(items, this.searchOptions);
      }),
      shareReplay(1),
    );

    this.filteredItems$ = combineLatest([search$, allItems$]).pipe(
      switchMap(([search, items]) => {
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
          return of([]);
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
        const normalizedInput = trimmedValue.toLocaleLowerCase();
        const existingValue = items.find((item) => item.name.trim().toLocaleLowerCase() === normalizedInput);
        if (existingValue && !existingValue.active) {
          this.listService.markItemTodo(listId, { ...existingValue, description: null });
          return;
        }

        if (!existingValue) {
          this.listService.addNewItem(listId, trimmedValue);
        }
      });
      this.inputControl.reset('', { emitEvent: true });
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.inputControl.reset('', { emitEvent: true });
      return;
    }

    // Skip custom keyboard navigation on mobile (autocomplete handles it)
    if (this.isMobile()) return;

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
      if (item && !item.active) {
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

  clearInput() {
    this.inputControl.reset('', { emitEvent: true });
  }

  onAutocompleteSelected(event: MatAutocompleteSelectedEvent): void {
    this.addItem(event.option.value as Item);
  }

  /**
   * Compact age of the item since it was (re)added to the list, e.g. "5m", "3h", "4d".
   * Returns null when the item has been on the list for more than 9 days.
   */
  itemAge(item: Item): string | null {
    const added = item.added ?? item.modified;
    if (!added) return null;
    // Clamp: server timestamps can be ahead of the last minute tick / local clock
    const elapsed = Math.max(0, this.now() - added.getTime());
    const minutes = Math.floor(elapsed / 60_000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > ListContainerComponent.maxAgeDays) return null;
    if (days >= 1) return $localize`:@@list.ageDays:${days}d`;
    if (hours >= 1) return $localize`:@@list.ageHours:${hours}h`;
    return $localize`:@@list.ageMinutes:${Math.max(minutes, 1)}m`;
  }

  markJustAdded(item: Item) {
    const added = item.added ?? item.modified;
    const message = added
      ? $localize`:@@list.markJustAddedConfirmWithDate:This item was added to the list on ${formatDate(added, 'dd.MM HH:mm', this.locale)}:INTERPOLATION:. Are you sure you want to mark the item as just added?`
      : $localize`:@@list.markJustAddedConfirm:Are you sure you want to mark the item as just added?`;

    const dialogRef = this.dialog.confirm({
      data: {
        title: $localize`:@@list.markJustAddedTitle:Mark as just added`,
        message,
      },
    });

    dialogRef.afterClosed().subscribe((response) => {
      if (!response) return;
      const listId = takeValue(this.listId);
      this.listService.markItemJustAdded(listId, item);
    });
  }

  markDone(item: Item) {
    // Add delay so animation has time to finish
    this.listId.pipe(delay(300)).subscribe((listId) => {
      this.listService.markItemDone(listId, item);
      const snackBarRef = this.snackBar.open($localize`:@@list.itemDone:${item.name} done!`, $localize`:@@list.revert:Revert`, {
        duration: 5000,
        verticalPosition: 'top',
      });
      snackBarRef.afterDismissed().subscribe((data) => {
        if (data.dismissedByAction) {
          // Reverting an accidental "done" keeps the original added time
          this.listService.markItemTodo(listId, item, true);
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
      this.snackBar.open($localize`:@@list.noInactiveItems:No inactive items left!`, $localize`:confirm|@@common.ok:OK`);
      return;
    }

    const dialogRef = this.dialog.confirm({
      data: { title: $localize`:@@list.markAllActive:Mark all active`, message: $localize`:@@list.reactivateConfirm:Are you sure you want to reactivate all items?` },
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

  inputDisplay(item?: Item): string {
    return item?.name ?? '';
  }

  trackById(index: number, item: { id?: string }) {
    return item?.id;
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('change', this.mobileQueryListener);
    clearInterval(this.nowTimer);
    this.destroy$?.next();
    this.destroy$?.complete();
    delete this.destroy$;
  }
}
