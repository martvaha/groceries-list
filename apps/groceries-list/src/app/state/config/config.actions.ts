import { createAction, props } from '@ngrx/store';
import { AppTheme } from './config.reducer';

export const setTheme = createAction('[Config] set theme', props<{ theme: AppTheme }>());
