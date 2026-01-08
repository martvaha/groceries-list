import { createAction, props } from '@ngrx/store';
import { Group } from '../../shared/models';

export const getGroups = createAction('[Group] get');
export const getGroupsNothingChanged = createAction('[Group] get nothing changed');

//! deprecated use upsertGroupsSuccess instead for better perf
export const upsertGroupSuccess = createAction('[Group] upsert', props<{ group: Group; listId: string }>());

export const upsertGroupsSuccess = createAction('[Group] upsert list', props<{ groups: Group[]; listId: string }>());

export const getGroupsSuccess = createAction('[Group] get', props<{ group: Group }>());

export const addGroup = createAction('[Group] add', props<{ group: Group; listId: string }>());

export const removeGroupsFromState = createAction(
  '[Group] Remove Groups From State',
  props<{ listId: string; groupIds: string[] }>()
);
