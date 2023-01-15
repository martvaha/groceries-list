import { Action, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import { setLanguage, setTheme } from './config.actions';

export type AppTheme = 'system' | 'dark' | 'light';
export type AppLanguage = 'system' | 'en' | 'et';

export interface ConfigState {
  theme: AppTheme;
  language: AppLanguage;
}

export const initialState: ConfigState = {
  theme: 'system',
  language: 'system',
};

const configReducer = createReducer(
  initialState,
  on(setTheme, (state, { theme }) => ({ ...state, theme })),
  on(setLanguage, (state, { language }) => ({ ...state, language }))
);

export function reducer(state: ConfigState | undefined, action: Action) {
  return configReducer(state, action);
}

export const selectConfigState = createFeatureSelector<ConfigState>('config');

export const selectTheme = createSelector(selectConfigState, (state: ConfigState) => state.theme);
export const selectLanguage = createSelector(selectConfigState, (state: ConfigState) => state.language);
