import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { Item, Group } from '../shared/models';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { takeValue, minLoadingTime } from '../shared/utils';
import { Store } from '@ngrx/store';
import { State } from '../state/app.reducer';
import { selectAllGroups } from '../state/group/group.reducer';
import { selectActiveListId } from '../state/list/list.reducer';
import { addGroup, getGroups } from '../state/group/group.actions';
import { getItems, updateItem } from '../state/item/item.actions';
import { selectItemEntities, selectItemLoading } from '../state/item/item.reducer';
import { Location } from '@angular/common';

@Component({
  selector: 'app-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEditComponent implements OnInit {
  ids!: Observable<{ listId: string; itemId: string }>;
  item!: Observable<Item | undefined>;
  groups!: Observable<Group[]>;
  loading$!: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private dialogService: DialogService,
    private store: Store<State>
  ) {}

  ngOnInit() {
    this.store.dispatch(getGroups());
    this.store.dispatch(getItems());
    this.loading$ = this.store.select(selectItemLoading).pipe(minLoadingTime());
    this.ids = this.route.paramMap.pipe(
      filter((params) => params.get('listId') !== null && params.get('itemId') !== null),
      map((params: ParamMap) => ({
        listId: params.get('listId') as string,
        itemId: params.get('itemId') as string,
      }))
    );

    this.item = combineLatest(this.ids, this.store.select(selectItemEntities)).pipe(
      map(([{ itemId }, entities]) => entities[itemId])
    );

    this.groups = this.store.select(selectAllGroups);
  }

  onGroupAdd() {
    const listId = takeValue(this.store.select(selectActiveListId));
    if (!listId) return;
    const dialogRef = this.dialogService.input({
      data: {
        actionLabel: 'Add',
        title: 'Add group',
        placeholder: 'Group name',
      },
    });
    dialogRef.afterClosed().subscribe(async (name) => {
      if (!name) return;
      const group = { name } as Group;
      this.store.dispatch(addGroup({ group, listId }));
    });
  }

  onItemUpdated(item: Item) {
    console.log(item);
    const listId = takeValue(this.store.select(selectActiveListId));
    if (!listId) return;
    this.store.dispatch(updateItem(item, listId, true));
  }

  onReturn() {
    this.location.back();
  }
}
