import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { List } from '../shared/models';
import { Store } from '@ngrx/store';
import { State, selectLoading } from '../state/app.reducer';
import { addList, removeList } from '../state/list/list.actions';
import { selectAllLists } from '../state/list/list.reducer';

@Component({
  standalone: false,
  selector: 'app-lists-container',
  templateUrl: './lists-container.component.html',
  styleUrls: ['./lists-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListsContainerComponent implements OnInit {
  private dialogService = inject(DialogService);
  private store = inject<Store<State>>(Store);

  lists$!: Observable<List[]>;
  loading$!: Observable<boolean>;

  ngOnInit() {
    this.loading$ = this.store.select(selectLoading);
    this.lists$ = this.store.select(selectAllLists);
  }

  addList() {
    const dialog = this.dialogService.input({
      data: { title: $localize`Add list`, placeholder: $localize`List title` },
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
        title: $localize`Remove list`,
        message: $localize`Are you sure you want to remove "${list.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe((resp) => {
      if (!resp) return;
      this.store.dispatch(removeList({ list }));
    });
  }
}
