import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on, createFeatureSelector, createSelector } from '@ngrx/store';
import { List } from '../../shared/models';
import * as ListActions from './list.actions';

export interface ListState extends EntityState<List> {
  activeId: string | null;
  loading: boolean;
}

export function sortByName(a: List, b: List): number {
  return a.name.localeCompare(b.name);
}

export const adapter: EntityAdapter<List> = createEntityAdapter<List>({
  sortComparer: sortByName
});

export const initialState: ListState = adapter.getInitialState({
  activeId: null,
  loading: false
});

const listReducer = createReducer(
  initialState,
  on(ListActions.loadLists, ListActions.addList, ListActions.removeList, state => ({ ...state, loading: true })),
  on(ListActions.upsertListSuccess, (state, { list }) => {
    return adapter.upsertOne(list, { ...state, loading: false });
  }),
  // on(ListActions.addList, (state, { list }) => {
  //   return adapter.upsertOne(list, state);
  // }),
  // on(ListActions.addList, (state, { list }) => {
  //   return adapter.upsertOne(list, state);
  // }),
  on(ListActions.removeListSuccess, (state, { list }) => {
    return adapter.removeOne(list.id, { ...state, loading: false });
  }),
  on(ListActions.loadListsNothingChanged, ListActions.addListSuccess, ListActions.removeListFail, state => ({
    ...state,
    loading: false
  })),
  on(ListActions.clearLists, state => {
    return adapter.removeAll({ ...state, loading: false, activeId: null });
  })
);

export function reducer(state: ListState | undefined, action: Action) {
  return listReducer(state, action);
}

export const selectLoading = (state: ListState) => state.loading;
const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const selectListState = createFeatureSelector<ListState>('list');

export const selectAllLists = createSelector(
  selectListState,
  selectAll
);
export const selectListStateLoading = createSelector(
  selectListState,
  selectLoading
);

export const selectListMaxModified = createSelector(
  selectAllLists,
  lists =>
    lists.reduce((prev, cur) => {
      const curModified = cur.modified || new Date(0);
      return curModified.getTime() > prev.getTime() ? curModified : prev;
    }, new Date(0))
);
