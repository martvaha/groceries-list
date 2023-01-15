import { Component, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { Group, Item } from '../shared/models';
import { takeValue } from '../shared/utils';
import { State } from '../state/app.reducer';
import { getGroups } from '../state/group/group.actions';
import { selectAllGroups } from '../state/group/group.reducer';
import { deleteItem, getItems, updateItem } from '../state/item/item.actions';
import { selectAllItems } from '../state/item/item.reducer';

@Component({
  selector: 'app-list-edit',
  styleUrls: ['./list-edit.component.scss'],
  templateUrl: './list-edit.component.html',
})
export class ListEditComponent implements OnInit {
  private listId!: Observable<string>;
  public items$!: Observable<Item[]>;
  public groups$!: Observable<Group[]>;
  constructor(private route: ActivatedRoute, private store: Store<State>, private dialogService: DialogService) {}

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('listId') as string));

    this.store.dispatch(getGroups());
    this.store.dispatch(getItems());

    this.items$ = this.store.select(selectAllItems);
    this.groups$ = this.store.select(selectAllGroups);
  }

  deleteList(item: Item) {
    const dialogRef = this.dialogService.confirm({
      data: {
        title: $localize`Delete list`,
        message: $localize`Are you sure you want to delete list "${item.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe((resp) => {
      if (!resp) return;
      const listId = takeValue(this.listId);
      this.store.dispatch(deleteItem({ item, listId }));
    });
  }

  onSelectionChange(event: MatSelectChange, item: Item) {
    const groupId = event.value;
    const listId = takeValue(this.listId);
    this.store.dispatch(updateItem({ ...item, groupId }, listId));
  }
}
