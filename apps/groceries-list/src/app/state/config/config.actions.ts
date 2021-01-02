import { createAction, props } from '@ngrx/store';
import { AppLanguage, AppTheme } from './config.reducer';

export const setTheme = createAction('[Config] set theme', props<{ theme: AppTheme }>());

export const setLanguage = createAction('[App] set language', props<{ language: AppLanguage }>());
