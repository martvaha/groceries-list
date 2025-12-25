import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import { concatMap, distinctUntilChanged, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { DialogService } from '../../shared/dialog-service/dialog.service';
import { List } from '../../shared/models';
import { TitleService } from '../../shared/title.service';
import { State } from '../app.reducer';
import { getGroups } from '../group/group.actions';
import { getItems } from '../item/item.actions';
import { selectRouteParams } from '../router/reducer';
import * as ListActions from './list.actions';
import { selectActiveList } from './list.reducer';
import { ListService } from './list.service';

@Injectable()
export class ListEffects {
  constructor(
    private actions$: Actions,
    private listService: ListService,
    private dialogService: DialogService,
    private store: Store<State>,
    private title: TitleService
  ) {}

  active$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROUTER_NAVIGATED),
      withLatestFrom(this.store.select(selectRouteParams)),
      map(([action, params]) => (params?.['listId'] || null) as string | null),
      distinctUntilChanged(),
      map((id) => ListActions.setActive({ id }))
    )
  );

  listTitle$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ListActions.setActive),
        switchMap(() =>
          this.store
            .select(selectActiveList)
            .pipe(tap((list) => (list ? this.title.setTitle(list.name) : this.title.clearTitle())))
        )
      ),
    { dispatch: false }
  );

  groupsOrder$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ListActions.upsertGroupsOrder),
        switchMap(({ groupsOrder, id }) => this.listService.updateList({ groupsOrder, id } as List))
      ),
    { dispatch: false }
  );

  setActive$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.setActive),
      switchMap(() => [getGroups(), getItems()])
    )
  );

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.loadLists),
      switchMap(() => {
        return this.listService.getLists().pipe(mergeMap((action) => action));
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
          .then(() => ListActions.removeListSuccess({ lists: [list] }))
          .catch((error) => ListActions.removeListFail({ error, list }))
      )
    )
  );

  error$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ListActions.removeListFail),
      switchMap(({ error, list }) => {
        const dialogRef = this.dialogService.confirm({
          data: { title: error.name, message: error.message, confirmLabel: $localize`Refresh`, confirmColor: 'accent' },
        });

        return dialogRef.afterClosed().pipe(
          map((resp) => {
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
