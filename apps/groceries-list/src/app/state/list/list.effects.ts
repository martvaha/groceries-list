import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, mergeMap, map, concatMap, withLatestFrom, tap, distinctUntilChanged } from 'rxjs/operators';
import { ListService } from './list.service';
import * as ListActions from './list.actions';
import { concat, of } from 'rxjs';
import { List } from '../../shared/models';
import { DialogService } from '../../shared/dialog-service/dialog.service';
import { ROUTER_NAVIGATED, RouterNavigationAction } from '@ngrx/router-store';
import { selectRouteParams } from '../router/reducer';
import { Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { State } from '../app.reducer';
import { selectActiveList } from './list.reducer';
import { TitleService } from '../../shared/title.service';

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
      map(([action, params]) => (params?.listId || null) as string | null),
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
