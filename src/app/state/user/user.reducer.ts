import { User } from '../../auth/auth.service';
import { createReducer, on, Action, createFeatureSelector, createSelector } from '@ngrx/store';
import * as UserActions from './user.actions';

export interface UserState {
  user: User | null | undefined;
}

export const initialState: UserState = {
  user: undefined
};

const userReducer = createReducer(
  initialState,
  on(UserActions.getUserSuccess, (state, { user }) => ({ ...state, user }))
);

export function reducer(state: UserState | undefined, action: Action) {
  return userReducer(state, action);
}

export const selectUserState = createFeatureSelector('user');

export const selectUser = createSelector(
  selectUserState,
  (state: UserState) => state.user
);
