import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on, createFeatureSelector, createSelector } from '@ngrx/store';
import { List } from '../../shared/models';
import * as ListActions from './list.actions';
import { maxModified, sortByName } from '../utils';
import { State } from '../app.reducer';

export interface ListState extends EntityState<List> {
  activeId: string | null;
  loading: boolean;
}

export const adapter: EntityAdapter<List> = createEntityAdapter<List>({
  sortComparer: sortByName,
});

export const initialState: ListState = adapter.getInitialState({
  activeId: null,
  loading: false,
});

const listReducer = createReducer(
  initialState,
  on(ListActions.loadLists, ListActions.addList, ListActions.removeList, (state) => ({ ...state, loading: true })),
  on(ListActions.upsertListSuccess, (state, { list }) => {
    return adapter.upsertOne(list, { ...state, loading: false });
  }),
  // on(ListActions.addList, (state, { list }) => {
  //   return adapter.upsertOne(list, state);
  // }),
  // on(ListActions.addList, (state, { list }) => {
  //   return adapter.upsertOne(list, state);
  // }),
  on(ListActions.upsertGroupsOrder, (state, { groupsOrder, id }) => {
    return adapter.updateOne({ id, changes: { groupsOrder } }, state);
  }),
  on(ListActions.setActive, (state, { id }) => ({ ...state, activeId: id })),
  on(ListActions.removeListSuccess, (state, { list }) => {
    return adapter.removeOne(list.id, { ...state, loading: false });
  }),
  on(ListActions.loadListsNothingChanged, ListActions.addListSuccess, ListActions.removeListFail, (state) => ({
    ...state,
    loading: false,
  })),
  on(ListActions.clearLists, (state) => {
    return adapter.removeAll({ ...state, loading: false, activeId: null });
  })
);

export function reducer(state: ListState | undefined, action: Action) {
  return listReducer(state, action);
}

export const selectLoading = (state: ListState) => state.loading;

const { selectEntities, selectAll } = adapter.getSelectors();

export const selectListState = createFeatureSelector<State, ListState>('list');

export const selectActiveListId = createSelector(selectListState, (state: ListState) => state.activeId);

export const selectAllLists = createSelector(selectListState, selectAll);
export const selectListEntities = createSelector(selectListState, selectEntities);

export const selectListStateLoading = createSelector(selectListState, selectLoading);

export const selectListMaxModified = createSelector(selectAllLists, maxModified);

export const selectActiveList = createSelector(selectListEntities, selectActiveListId, (entities, activeId) =>
  activeId ? entities[activeId] : null
);

export const selectGroupsOrder = createSelector(selectActiveList, (list) => (list ? list.groupsOrder : null));
