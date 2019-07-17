import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, mergeMap, map, concatMap } from 'rxjs/operators';
import { ListService } from './lists/list.service';
import * as ListActions from './lists/list.actions';
import { of } from 'rxjs';
import { List } from '../shared/models';
import { DialogService } from '../shared/dialog-service/dialog.service';

@Injectable()
export class AppEffects {
  constructor(private actions$: Actions, private listService: ListService, private dialogService: DialogService) {}

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.loadLists),
      switchMap(() => {
        return this.listService.getLists();
      })
    )
  );

  add$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.addList),
      concatMap(({ list }) => this.listService.addList(list).then(() => ListActions.addListSuccess()))
    )
  );

  remove$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.removeList),
      concatMap(({ list }) =>
        this.listService
          .removeList(list)
          .then(() => ListActions.removeListSuccess({ list }))
          .catch(error => ListActions.removeListFail({ error, list }))
      )
    )
  );

  error$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.removeListFail),
      switchMap(({ error, list }) => {
        const dialogRef = this.dialogService.confirm({
          data: { title: error.name, message: error.message, confirmLabel: 'Värskenda lehte', confirmColor: 'accent' }
        });

        return dialogRef.afterClosed().pipe(
          map(resp => {
            if (resp) {
              return ListActions.removeListFailReload({ error, list });
            } else {
              return ListActions.removeListFailIgnore({ error, list });
            }
          })
        );
      })
    )
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.removeListFailReload, ListActions.reload),
      switchMap(() => [ListActions.clearLists(), ListActions.loadLists()])
    )
  );
}
