import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on, createFeatureSelector, createSelector } from '@ngrx/store';
import { Item } from '../../shared/models';
import {
  upsertItemSuccess,
  setGroupId,
  updateItem,
  deleteItem,
  deleteItemSuccess,
  deleteItemFail,
  upsertItemListSuccess,
  updateItemSuccess,
  updateItemFail,
  removeItemsFromState,
  markItemDone,
  markItemTodo,
  markItemJustAdded,
  markItemsTodo,
  markItemsFail,
} from './item.actions';
import { selectActiveListId } from '../list/list.reducer';
import { State } from '../app.reducer';
import { lastUpdated, sortByName } from '../utils';
import { coerceDate } from '../../shared/utils';

export interface ItemState extends EntityState<Item> {
  loading: boolean;
  lastUpdated: Date | null;
}
export interface ItemListState {
  [id: string]: ItemState;
}

export const adapter: EntityAdapter<Item> = createEntityAdapter<Item>({
  sortComparer: sortByName,
});

export const initialItemState: ItemState = adapter.getInitialState({
  loading: false,
  lastUpdated: null,
});
export const initialState: ItemListState = {};

function get(state: ItemListState, listId: string | null) {
  return (listId && state[listId]) || initialItemState;
}

/**
 * Advance the listener high-water mark using server `modified` timestamps only.
 * Never regresses, and keeps the same reference when nothing advances so the
 * `selectItemLastUpdated` stream doesn't emit (avoids Firestore listener churn).
 */
function maxModified(prev: Date | null, items: Item[]): Date | null {
  let max = coerceDate(prev);
  for (const { modified } of items) {
    const date = coerceDate(modified);
    if (date && (!max || date > max)) max = date;
  }
  return max;
}

const listReducer = createReducer(
  initialState,
  on(upsertItemSuccess, deleteItemFail, (state, { item, listId }) => {
    const prev = get(state, listId);
    return {
      ...state,
      [listId]: {
        ...adapter.upsertOne(item, prev),
        loading: false,
        lastUpdated: maxModified(prev.lastUpdated, [item]),
      },
    };
  }),
  on(upsertItemListSuccess, (state, { items, listId }) => {
    const prev = get(state, listId);
    return {
      ...state,
      [listId]: {
        ...adapter.upsertMany(items, prev),
        loading: false,
        lastUpdated: maxModified(prev.lastUpdated, items),
      },
    };
  }),
  // Optimistic mark updates: apply the change locally right away so the UI
  // doesn't depend on the Firestore listener echo (which can silently stall on
  // mobile PWAs). None of these touch lastUpdated — the high-water mark must
  // stay server-driven so the echo is still fetched and reconciled.
  on(markItemDone, (state, { item, listId }) => {
    return {
      ...state,
      [listId]: adapter.updateOne({ id: item.id, changes: { active: false } }, get(state, listId)),
    };
  }),
  on(markItemTodo, (state, { item, listId, preserveAdded }) => {
    return {
      ...state,
      [listId]: adapter.updateOne(
        {
          id: item.id,
          changes: {
            active: true,
            description: item.description ?? null,
            added: preserveAdded && item.added ? item.added : new Date(),
          },
        },
        get(state, listId),
      ),
    };
  }),
  on(markItemJustAdded, (state, { item, listId }) => {
    return {
      ...state,
      [listId]: adapter.updateOne({ id: item.id, changes: { added: new Date() } }, get(state, listId)),
    };
  }),
  on(markItemsTodo, (state, { items, listId }) => {
    return {
      ...state,
      [listId]: adapter.updateMany(
        items.map((item) => ({ id: item.id, changes: { active: true, added: new Date() } })),
        get(state, listId),
      ),
    };
  }),
  // Rollback: restore the pre-update snapshots. setMany (full replace, not a
  // merge) so an optimistic `added` is cleared when the snapshot had none.
  on(markItemsFail, (state, { items, listId }) => {
    return {
      ...state,
      [listId]: adapter.setMany(items, get(state, listId)),
    };
  }),
  on(setGroupId, (state, { item, listId, groupId }) => {
    return {
      ...state,
      [listId]: adapter.updateOne({ id: item.id, changes: { groupId } }, get(state, listId)),
    };
  }),
  on(updateItem, (state, { listId }) => {
    return { ...state, [listId]: { ...get(state, listId), loading: true } };
  }),

  on(updateItemSuccess, updateItemFail, (state, { listId }) => {
    return { ...state, [listId]: { ...get(state, listId), loading: false } };
  }),
  on(deleteItem, (state, { item, listId }) => {
    const updatedList = adapter.removeOne(item.id, get(state, listId));
    return { ...state, [listId]: { ...updatedList, loading: true } };
  }),
  on(deleteItemSuccess, (state, { item, listId }) => {
    const updatedList = { ...get(state, listId), loading: false };
    return { ...state, [listId]: updatedList };
  }),
  on(removeItemsFromState, (state, { listId, itemIds }) => {
    // Deletions arrive through the same upsert path that advances lastUpdated,
    // so keep the existing high-water mark here (client clock would skew it).
    const updatedList = adapter.removeMany(itemIds, get(state, listId));
    return { ...state, [listId]: updatedList };
  }),
);

export function reducer(state: ItemListState | undefined, action: Action) {
  return listReducer(state, action);
}

// export const selectLoading = (state: GroupState) => state.loading;
const { selectEntities, selectAll } = adapter.getSelectors();

export const selectItemState = createFeatureSelector<State, ItemListState>('item');

export const selectActiveListItemState = createSelector(selectItemState, selectActiveListId, (state, listId) =>
  get(state, listId),
);

export const selectAllItems = createSelector(selectActiveListItemState, selectAll);
export const selectAllInactiveItems = createSelector(selectAllItems, (items) => items.filter((item) => !item.active));

export const selectItemEntities = createSelector(selectActiveListItemState, selectEntities);

export const selectAllActiveItems = createSelector(selectAllItems, (items) => items.filter((item) => item.active));

export const selectActiveItemsByGroup = createSelector(selectAllActiveItems, (items) => {
  console.log('selectActiveItemsByGroup input', items);
  const data = items.reduce(
    (prev, cur) => ({
      ...prev,
      [cur.groupId]: prev[cur.groupId] ? [...prev[cur.groupId], cur] : [cur],
    }),
    {} as { [groupId: string]: Item[] },
  );
  console.log('selectActiveItemsByGroup output', data);
  return data;
});

export const selectItemLoading = createSelector(selectActiveListItemState, (state: ItemState) => state.loading);
export const selectItemLastUpdated = createSelector(selectActiveListItemState, lastUpdated);
