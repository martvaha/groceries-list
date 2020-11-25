import { createAction, props } from '@ngrx/store';
import { Item } from '../../shared/models';

export const getItems = createAction('[Item] get');
export const getItemsNothingChanged = createAction(
  '[Item] get nothing changed'
);
export const upsertItemSuccess = createAction(
  '[Item] upsert',
  props<{ item: Item; listId: string }>()
);
export const deleteItem = createAction(
  '[Item] delete',
  props<{ item: Item; listId: string }>()
);
export const deleteItemSuccess = createAction(
  '[Item] delete success',
  props<{ item: Item; listId: string }>()
);
export const deleteItemFail = createAction(
  '[Item] delete fail',
  props<{ item: Item; listId: string }>()
);
// export const upsertGroup = createAction('[Item] get not changed');

export const setGroupId = createAction(
  '[Item] set group id',
  props<{ item: Item; listId: string; groupId: string }>()
);
export const updateItem = createAction(
  '[Item] update',
  (item: Item, listId: string, returnToList?: boolean) => ({
    item,
    listId,
    returnToList: returnToList || false,
  })
);
export const updateItemSuccess = createAction(
  '[Item] update success',
  props<{ item: Item; listId: string; returnToList: boolean }>()
);
export const updateItemFail = createAction(
  '[Item] update fail',
  props<{ item: Item; listId: string }>()
);
