import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { map } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { State } from '../state/app.reducer';
import { Store } from '@ngrx/store';
import { getGroups } from '../state/group/group.actions';
import { getItems, deleteItem, updateItem } from '../state/item/item.actions';
import { selectAllItems } from '../state/item/item.reducer';
import { Item, Group } from '../shared/models';
import { selectAllGroups } from '../state/group/group.reducer';
import { MatSelectChange } from '@angular/material/select';
import { takeValue } from '../shared/utils';

@Component({
  selector: 'app-list-edit',
  styleUrls: ['./list-edit.component.scss'],
  templateUrl: './list-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListEditComponent implements OnInit {
  private listId!: Observable<string>;
  public items$!: Observable<Item[]>;
  public groups$!: Observable<Group[]>;
  constructor(
    private route: ActivatedRoute,
    private store: Store<State>,
    private db: AngularFirestore,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.listId = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('listId') as string)
    );

    this.store.dispatch(getGroups());
    this.store.dispatch(getItems());

    this.items$ = this.store.select(selectAllItems);
    this.groups$ = this.store.select(selectAllGroups);
  }

  deleteList(item: Item) {
    const dialogRef = this.dialogService.confirm({
      data: {
        title: 'Kustutamine',
        message: `Kas oled kindel, et soovid "${item.name}" kusutatad?`,
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
