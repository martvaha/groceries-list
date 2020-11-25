import { createAction, props } from '@ngrx/store';
import { Group } from '../../shared/models';

export const getGroups = createAction('[Group] get');
export const getGroupsNothingChanged = createAction('[Group] get nothing changed');
export const upsertGroupSuccess = createAction('[Group] upsert', props<{ group: Group; listId: string }>());
// export const upsertGroup = createAction('[Group] get not changed');

export const getGroupsSuccess = createAction('[Group] get', props<{ group: Group }>());

export const addGroup = createAction('[Group] add', props<{ group: Group, listId: string }>());
