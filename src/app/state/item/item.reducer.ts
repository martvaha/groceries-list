import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on, createFeatureSelector, createSelector } from '@ngrx/store';
import { Item } from '../../shared/models';
import { upsertItemSuccess, setGroupId } from './item.actions';
import { selectActiveListId } from '../list/list.reducer';
import { State } from '../app.reducer';
import { maxModified, sortByName } from '../utils';

export interface ItemState extends EntityState<Item> {}
export interface ItemListState {
  [id: string]: ItemState;
}

export const adapter: EntityAdapter<Item> = createEntityAdapter<Item>({
  sortComparer: sortByName
});

export const initialItemState: ItemState = adapter.getInitialState();
export const initialState: ItemListState = {};

function get(state: ItemListState, listId: string | null) {
  return (listId && state[listId]) || initialItemState;
}

const listReducer = createReducer(
  initialState,
  // on(upsertGroupSuccess, ListActions.addList, ListActions.removeList, state => ({ ...state, loading: true })),
  on(upsertItemSuccess, (state, { item, listId }) => {
    return { ...state, [listId]: adapter.upsertOne(item, get(state, listId)) };
  }),
  on(setGroupId, (state, { item, listId, groupId }) => {
    return { ...state, [listId]: adapter.updateOne({ id: item.id, changes: { groupId } }, get(state, listId)) };
  })
  // on(ListActions.addList, (state, { list }) => {
  //   return adapter.upsertOne(list, state);
  // }),
  // on(ListActions.addList, (state, { list }) => {
  //   return adapter.upsertOne(list, state);
  // }),
  // on(ListActions.setActive, (state, { id }) => ({ ...state, activeId: id })),
  // on(ListActions.removeListSuccess, (state, { list }) => {
  //   return adapter.removeOne(list.id, { ...state, loading: false });
  // }),
  // on(ListActions.loadListsNothingChanged, ListActions.addListSuccess, ListActions.removeListFail, state => ({
  //   ...state,
  //   loading: false
  // })),
  // on(ListActions.clearLists, state => {
  //   return adapter.removeAll({ ...state, loading: false, activeId: null });
  // })
);

export function reducer(state: ItemListState | undefined, action: Action) {
  return listReducer(state, action);
}

// export const selectLoading = (state: GroupState) => state.loading;
const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const selectItemState = createFeatureSelector<State, ItemListState>('item');

export const selectActiveListItemState = createSelector(
  selectItemState,
  selectActiveListId,
  (state, listId) => get(state, listId)
);

export const selectAllItems = createSelector(
  selectActiveListItemState,
  selectAll
);

export const selectItemEntities = createSelector(
  selectActiveListItemState,
  selectEntities
);

export const selectAllActiveItems = createSelector(
  selectAllItems,
  items => items.filter(item => item.active)
);

export const selectActiveItemsByGroup = createSelector(
  selectAllActiveItems,
  items => {
    console.log('selectActiveItemsByGroup input', items);
    const data = items.reduce(
      (prev, cur) => ({ ...prev, [cur.groupId]: prev[cur.groupId] ? [...prev[cur.groupId], cur] : [cur] }),
      {} as { [groupId: string]: Item[] }
    );
    console.log('selectActiveItemsByGroup output', data);
    return data;
  }
);

// export const selectActiveListId = createSelector(
//   selectListState,
//   (state: GroupState) => state.activeId
// );

// export const selectAllLists = createSelector(
//   selectListState,
//   selectAll
// );
// export const selectListStateLoading = createSelector(
//   selectListState,
//   selectLoading
// );

export const selectItemMaxModified = createSelector(
  selectAllItems,
  maxModified
);
