import { createAction, props } from '@ngrx/store';
import { Item } from '../../shared/models';

export const getItems = createAction('[Item] get');
export const getItemsFail = createAction('[Item] get fail', props<{ error: Error }>());
export const getItemsNothingChanged = createAction('[Item] get nothing changed');
export const upsertItemSuccess = createAction('[Item] upsert', props<{ item: Item; listId: string }>());
export const upsertItemListSuccess = createAction('[Item] upsert list', props<{ items: Item[]; listId: string }>());

export const deleteItem = createAction('[Item] delete', props<{ item: Item; listId: string }>());
export const deleteItemSuccess = createAction(
  '[Item] delete success',
  props<{ item: Item | Item[]; listId: string }>()
);
export const deleteItemFail = createAction('[Item] delete fail', props<{ item: Item; listId: string }>());
export const removeItemsFromState = createAction(
  '[Item] Remove Items From State',
  props<{ listId: string; itemIds: string[] }>()
);
// export const upsertGroup = createAction('[Item] get not changed');

// Optimistic mark actions: the reducer applies the change immediately,
// an effect performs the Firestore write, markItemsFail rolls back on failure.
export const markItemDone = createAction('[Item] mark done', props<{ item: Item; listId: string }>());
export const markItemTodo = createAction(
  '[Item] mark todo',
  (item: Item, listId: string, preserveAdded = false) => ({ item, listId, preserveAdded })
);
export const markItemJustAdded = createAction('[Item] mark just added', props<{ item: Item; listId: string }>());
export const markItemsTodo = createAction('[Item] mark all todo', props<{ items: Item[]; listId: string }>());
export const markItemsFail = createAction(
  '[Item] mark fail',
  props<{ items: Item[]; listId: string; error: Error }>()
);

export const setGroupId = createAction('[Item] set group id', props<{ item: Item; listId: string; groupId: string }>());
export const updateItem = createAction('[Item] update', (item: Item, listId: string, returnToList?: boolean) => ({
  item,
  listId,
  returnToList: returnToList || false,
}));
export const updateItemSuccess = createAction(
  '[Item] update success',
  props<{ item: Item; listId: string; returnToList: boolean }>()
);
export const updateItemFail = createAction('[Item] update fail', props<{ item: Item; listId: string }>());
