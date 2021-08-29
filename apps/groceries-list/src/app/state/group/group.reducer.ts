import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, Action, on, createFeatureSelector, createSelector } from '@ngrx/store';
import { Group } from '../../shared/models';
import { upsertGroupSuccess } from './group.actions';
import { selectActiveListId } from '../list/list.reducer';
import { lastUpdated, sortByName } from '../utils';

export interface GroupState extends EntityState<Group> {
  loading: boolean;
  lastUpdated: Date | null;
}

export interface GroupListState {
  [id: string]: GroupState;
}

export const adapter: EntityAdapter<Group> = createEntityAdapter<Group>({
  sortComparer: sortByName,
});

export const initialGroupState: GroupState = adapter.getInitialState({
  loading: false,
  lastUpdated: null,
});

export const initialState: GroupListState = {};

function get(state: GroupListState, listId: string | null) {
  return (listId && state[listId]) || initialGroupState;
}

const listReducer = createReducer(
  initialState,
  // on(upsertGroupSuccess, ListActions.addList, ListActions.removeList, state => ({ ...state, loading: true })),
  on(upsertGroupSuccess, (state, { group, listId }) => {
    return {
      ...state,
      [listId]: { ...adapter.upsertOne(group, get(state, listId)), lastUpdated: new Date(Date.now()) },
    };
  })
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
  console.log('selectAllGroups', data);
  return selectAll(data);
});

export const selectGroupLastUpdated = createSelector(selectActiveListGroupState, lastUpdated);
