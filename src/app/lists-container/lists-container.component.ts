import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../auth/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { switchMap, map, filter, take } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { LoadingService } from '../shared/loading-service';
import { List } from '../shared/models';
import { Store } from '@ngrx/store';
import { State, selectLoading } from '../state/app.reducer';
import { loadLists, addList, removeList } from '../state/lists/list.actions';
import { selectAllLists } from '../state/lists/lists.reducer';
import { takeValue } from '../shared/utils';

@Component({
  selector: 'gl-lists-container',
  templateUrl: './lists-container.component.html',
  styleUrls: ['./lists-container.component.scss']
})
export class ListsContainerComponent implements OnInit {
  public lists$: Observable<List[]>;
  loading$: Observable<boolean>;

  constructor(
    private db: AngularFirestore,
    private auth: AuthService,
    private dialogService: DialogService,
    private store: Store<State>
  ) {}

  ngOnInit() {
    this.store.dispatch(loadLists());
    this.loading$ = this.store.select(selectLoading);
    this.lists$ = this.store.select(selectAllLists);
  }

  addList() {
    const dialog = this.dialogService.input({
      data: { placeholder: 'Nimekirja pealkiri', title: 'Nimekirja lisamine' }
    });
    dialog.afterClosed().subscribe(name => {
      const list = { name } as List;
      this.store.dispatch(addList({ list }));
    });
  }

  deleteList(list: List) {
    const dialogRef = this.dialogService.confirm({
      data: {
        title: 'Nimekirja kustutamine',
        message: `Kas oled kindel, et soovid nimekirja "${list.name}" kusutatad?`
      }
    });
    dialogRef.afterClosed().subscribe(resp => {
      if (!resp) return;
      this.store.dispatch(removeList({ list }));
    });
  }
}
