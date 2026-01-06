import { createAction } from '@ngrx/store';

export const initAppEffects = createAction('[App] init app effects');
export const clearState = createAction('[App] clear state');
export const checkForUpdate = createAction('[App] check for update');
