import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { List } from '../shared/models';
import { Store } from '@ngrx/store';
import { State, selectLoading } from '../state/app.reducer';
import { addList, removeList } from '../state/list/list.actions';
import { selectAllLists } from '../state/list/list.reducer';

@Component({
  selector: 'app-lists-container',
  templateUrl: './lists-container.component.html',
  styleUrls: ['./lists-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListsContainerComponent implements OnInit {
  lists$!: Observable<List[]>;
  loading$!: Observable<boolean>;

  constructor(private dialogService: DialogService, private store: Store<State>) {}

  ngOnInit() {
    this.loading$ = this.store.select(selectLoading);
    this.lists$ = this.store.select(selectAllLists);
  }

  addList() {
    const dialog = this.dialogService.input({
      data: { title: 'Add list', placeholder: 'List title' },
    });
    dialog.afterClosed().subscribe((name) => {
      if (!name) return;
      const list = { name } as List;
      this.store.dispatch(addList({ list }));
    });
  }

  deleteList(list: List) {
    const dialogRef = this.dialogService.confirm({
      data: {
        title: 'Remove list',
        message: `Are you sure you want to remove "${list.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe((resp) => {
      if (!resp) return;
      this.store.dispatch(removeList({ list }));
    });
  }
}
