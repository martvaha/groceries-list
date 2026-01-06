import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import { catchError, concatMap, distinctUntilChanged, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { from, of } from 'rxjs';
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

export const active$ = createEffect(
  (actions$ = inject(Actions), store = inject<Store<State>>(Store)) =>
    actions$.pipe(
      ofType(ROUTER_NAVIGATED),
      withLatestFrom(store.select(selectRouteParams)),
      map(([action, params]) => (params?.['listId'] || null) as string | null),
      distinctUntilChanged(),
      map((id) => ListActions.setActive({ id }))
    ),
  { functional: true }
);

export const listTitle$ = createEffect(
  (actions$ = inject(Actions), store = inject<Store<State>>(Store), title = inject(TitleService)) =>
    actions$.pipe(
      ofType(ListActions.setActive),
      switchMap(() =>
        store.select(selectActiveList).pipe(tap((list) => (list ? title.setTitle(list.name) : title.clearTitle())))
      )
    ),
  { functional: true, dispatch: false }
);

export const groupsOrder$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(ListActions.upsertGroupsOrder),
      switchMap(({ groupsOrder, id }) => listService.updateList({ groupsOrder, id } as List))
    ),
  { functional: true, dispatch: false }
);

export const setActive$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ListActions.setActive),
      switchMap(() => [getGroups(), getItems()])
    ),
  { functional: true }
);

export const load$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(ListActions.loadLists),
      switchMap(() => {
        return listService.getLists().pipe(mergeMap((action) => action));
      })
    ),
  { functional: true }
);

export const add$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(ListActions.addList),
      concatMap(({ list }) => listService.addList(list).then(() => ListActions.addListSuccess()))
    ),
  { functional: true }
);

export const remove$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(ListActions.removeList),
      concatMap(({ list }) =>
        listService
          .removeList(list)
          .then(() => ListActions.removeListSuccess({ lists: [list] }))
          .catch((error) => ListActions.removeListFail({ error, list }))
      )
    ),
  { functional: true }
);

export const error$ = createEffect(
  (actions$ = inject(Actions), dialogService = inject(DialogService)) =>
    actions$.pipe(
      ofType(ListActions.removeListFail),
      switchMap(({ error, list }) => {
        const dialogRef = dialogService.confirm({
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
    ),
  { functional: true }
);

export const reload$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ListActions.removeListFailReload, ListActions.reload),
      switchMap(() => [ListActions.clearLists(), ListActions.loadLists()])
    ),
  { functional: true }
);

export const toggleFavorite$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(ListActions.toggleFavorite),
      concatMap(({ listId, isFavorite }) =>
        from(listService.toggleFavorite(listId, isFavorite)).pipe(
          map(() => ListActions.loadListsNothingChanged()),
          catchError(() => of(ListActions.loadListsNothingChanged()))
        )
      )
    ),
  { functional: true }
);

export const listEffects = {
  active$,
  listTitle$,
  groupsOrder$,
  setActive$,
  load$,
  add$,
  remove$,
  error$,
  reload$,
  toggleFavorite$,
};
