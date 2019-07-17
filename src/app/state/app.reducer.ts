import { ActionReducerMap, createSelector, MetaReducer, ActionReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import { ListState, reducer as listReducer, selectListStateLoading } from './lists/lists.reducer';
import { localStorageSync } from 'ngrx-store-localstorage';

export interface State {
  list: ListState;
}

export const reducers: ActionReducerMap<State> = {
  list: listReducer
};

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return localStorageSync({ keys: [{ list: ['entities', 'ids'] }], rehydrate: true })(reducer);
}

export const metaReducers: MetaReducer<State>[] = !environment.production
  ? [localStorageSyncReducer]
  : [localStorageSyncReducer];

export const selectLoading = createSelector(
  selectListStateLoading,
  listLoading => listLoading
);
