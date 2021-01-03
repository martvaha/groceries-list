import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on, createFeatureSelector, createSelector } from '@ngrx/store';
import { Group } from '../../shared/models';
import { upsertGroupSuccess } from './group.actions';
import { selectActiveListId } from '../list/list.reducer';
import { maxModified, sortByName } from '../utils';

export type GroupState = EntityState<Group>
export interface GroupListState {
  [id: string]: GroupState;
}

export const adapter: EntityAdapter<Group> = createEntityAdapter<Group>({
  sortComparer: sortByName,
});

export const initialGroupState: GroupState = adapter.getInitialState();
export const initialState: GroupListState = {};

function get(state: GroupListState, listId: string | null) {
  return (listId && state[listId]) || initialGroupState;
}

const listReducer = createReducer(
  initialState,
  // on(upsertGroupSuccess, ListActions.addList, ListActions.removeList, state => ({ ...state, loading: true })),
  on(upsertGroupSuccess, (state, { group, listId }) => {
    return { ...state, [listId]: adapter.upsertOne(group, get(state, listId)) };
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

export function reducer(state: GroupListState | undefined, action: Action) {
  return listReducer(state, action);
}

// export const selectLoading = (state: GroupState) => state.loading;
const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const selectGroupState = createFeatureSelector<GroupListState>('group');

export const selectActiveListGroupState = createSelector(selectGroupState, selectActiveListId, (state, listId) =>
  get(state, listId)
);

export const selectAllGroups = createSelector(selectActiveListGroupState, (data) => {
  console.log('slectAllGroups', data);
  return selectAll(data);
});

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

export const selectGroupMaxModified = createSelector(selectAllGroups, maxModified);
