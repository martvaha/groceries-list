import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { from, of } from 'rxjs';
import { switchMap, filter, tap, map, mergeMap, catchError } from 'rxjs/operators';
import { ItemService } from './item.service';
import { ListService } from '../../list/list.service';
import { captureException } from '../../shared/sentry';
import {
  getItems,
  setGroupId,
  updateItem,
  updateItemSuccess,
  updateItemFail,
  deleteItem,
  deleteItemSuccess,
  deleteItemFail,
  getItemsFail,
  getItemsNothingChanged,
  markItemDone,
  markItemTodo,
  markItemJustAdded,
  markItemsTodo,
  markItemsFail,
} from './item.actions';

export const loadItems$ = createEffect(
  (actions$ = inject(Actions), itemService = inject(ItemService)) =>
    actions$.pipe(
      ofType(getItems),
      switchMap(() => {
        return itemService.getItems();
      })
    ),
  { functional: true }
);

export const loadItemsFail$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(getItemsFail),
      tap(() => router.navigate(['home']))
    ),
  { functional: true, dispatch: false }
);

export const setGroup$ = createEffect(
  (actions$ = inject(Actions), itemService = inject(ItemService)) =>
    actions$.pipe(
      ofType(setGroupId),
      switchMap(({ item, groupId, listId }) => itemService.updateItem({ ...item, groupId }, listId))
    ),
  { functional: true, dispatch: false }
);

export const updateItemEffect$ = createEffect(
  (actions$ = inject(Actions), itemService = inject(ItemService)) =>
    actions$.pipe(
      ofType(updateItem),
      switchMap(({ item, listId, returnToList }) =>
        itemService
          .updateItem(item, listId)
          .then(() => updateItemSuccess({ item, listId, returnToList }))
          .catch((error) => updateItemFail(error))
      )
    ),
  { functional: true }
);

export const deleteItemEffect$ = createEffect(
  (actions$ = inject(Actions), itemService = inject(ItemService)) =>
    actions$.pipe(
      ofType(deleteItem),
      switchMap(({ item, listId }) =>
        itemService
          .deleteItem(item, listId)
          .then(() => deleteItemSuccess({ item, listId }))
          .catch((error) => deleteItemFail(error))
      )
    ),
  { functional: true }
);

// Mark effects perform the Firestore write for optimistic mark actions (the
// reducer already applied the change). mergeMap, not switchMap: rapid
// successive marks must not cancel each other's result mapping.
export const markItemDone$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(markItemDone),
      mergeMap(({ item, listId }) =>
        from(listService.markItemDone(listId, item)).pipe(
          map(() => getItemsNothingChanged()),
          catchError((error) => {
            captureException(error);
            return of(markItemsFail({ items: [item], listId, error }));
          })
        )
      )
    ),
  { functional: true }
);

export const markItemTodo$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(markItemTodo),
      mergeMap(({ item, listId, preserveAdded }) =>
        from(listService.markItemTodo(listId, item, preserveAdded)).pipe(
          map(() => getItemsNothingChanged()),
          catchError((error) => {
            captureException(error);
            return of(markItemsFail({ items: [item], listId, error }));
          })
        )
      )
    ),
  { functional: true }
);

export const markItemJustAdded$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(markItemJustAdded),
      mergeMap(({ item, listId }) =>
        from(listService.markItemJustAdded(listId, item)).pipe(
          map(() => getItemsNothingChanged()),
          catchError((error) => {
            captureException(error);
            return of(markItemsFail({ items: [item], listId, error }));
          })
        )
      )
    ),
  { functional: true }
);

export const markItemsTodo$ = createEffect(
  (actions$ = inject(Actions), listService = inject(ListService)) =>
    actions$.pipe(
      ofType(markItemsTodo),
      mergeMap(({ items, listId }) =>
        from(Promise.all(items.map((item) => listService.markItemTodo(listId, item)))).pipe(
          map(() => getItemsNothingChanged()),
          catchError((error) => {
            captureException(error);
            return of(markItemsFail({ items, listId, error }));
          })
        )
      )
    ),
  { functional: true }
);

export const returnToList$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(updateItemSuccess),
      filter(({ returnToList }) => returnToList),
      tap(({ listId }) => router.navigate(['home', 'list', listId]))
    ),
  { functional: true, dispatch: false }
);

export const itemEffects = {
  loadItems$,
  loadItemsFail$,
  setGroup$,
  updateItemEffect$,
  deleteItemEffect$,
  markItemDone$,
  markItemTodo$,
  markItemJustAdded$,
  markItemsTodo$,
  returnToList$,
};
