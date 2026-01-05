import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, filter, tap } from 'rxjs/operators';
import { ItemService } from './item.service';
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
  returnToList$,
};
