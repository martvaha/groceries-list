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
} from './item.actions';
import { selectActiveListId } from '../list/list.reducer';
import { State } from '../app.reducer';
import { lastUpdated, sortByName } from '../utils';

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

const listReducer = createReducer(
  initialState,
  on(upsertItemSuccess, deleteItemFail, (state, { item, listId }) => {
    return {
      ...state,
      [listId]: {
        ...adapter.upsertOne(item, get(state, listId)),
        loading: false,
        lastUpdated: new Date(),
      },
    };
  }),
  on(upsertItemListSuccess, (state, { items, listId }) => {
    return {
      ...state,
      [listId]: {
        ...adapter.upsertMany(items, get(state, listId)),
        loading: false,
        lastUpdated: new Date(),
      },
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
  })
);

export function reducer(state: ItemListState | undefined, action: Action) {
  return listReducer(state, action);
}

// export const selectLoading = (state: GroupState) => state.loading;
const { selectEntities, selectAll } = adapter.getSelectors();

export const selectItemState = createFeatureSelector<State, ItemListState>('item');

export const selectActiveListItemState = createSelector(selectItemState, selectActiveListId, (state, listId) =>
  get(state, listId)
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
    {} as { [groupId: string]: Item[] }
  );
  console.log('selectActiveItemsByGroup output', data);
  return data;
});

export const selectItemLoading = createSelector(selectActiveListItemState, (state: ItemState) => state.loading);
export const selectItemLastUpdated = createSelector(selectActiveListItemState, lastUpdated);
