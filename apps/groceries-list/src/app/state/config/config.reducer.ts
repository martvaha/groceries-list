import { createReducer, on, Action, createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from '../app.reducer';
import { setTheme } from './config.actions';

export type AppTheme = 'system' | 'dark' | 'light';

export interface ConfigState {
  theme: AppTheme;
}

export const initialState: ConfigState = {
  theme: 'system',
};

const configReducer = createReducer(
  initialState,
  on(setTheme, (state, { theme }) => ({ ...state, theme }))
);

export function reducer(state: ConfigState | undefined, action: Action) {
  return configReducer(state, action);
}

export const selectConfigState = createFeatureSelector<State, ConfigState>('config');

export const selectTheme = createSelector(selectConfigState, (state: ConfigState) => state.theme);
