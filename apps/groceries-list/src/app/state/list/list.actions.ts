import { createAction, props } from '@ngrx/store';
import { Update, Predicate, EntityMap } from '@ngrx/entity';

import { List } from '../../shared/models';

export const loadLists = createAction('[List] load');
export const loadListsNothingChanged = createAction('[List] load nothing changed');
export const removeListSuccess = createAction('[List] remove success', props<{ lists: List[] }>());
export const removeListFail = createAction('[List] remove fail', props<{ error: Error; list: List }>());
export const removeListFailReload = createAction('[List] remove fail reload', props<{ error: Error; list: List }>());
export const removeListFailIgnore = createAction('[List] remove fail ignore', props<{ error: Error; list: List }>());

export const addList = createAction('[List] add', props<{ list: List }>());
export const addListSuccess = createAction('[List] add success');
export const upsertListSuccess = createAction('[List] upsert success', props<{ lists: List[] }>());

export const removeList = createAction('[List] remove', props<{ list: List }>());
export const reload = createAction('[List] reload');
export const updateList = createAction('[List] update', props<{ list: Update<List> }>());

export const setActive = createAction('[List] set active', props<{ id: string | null }>());
export const upsertGroupsOrder = createAction('[List] upsert order', props<{ groupsOrder: string[]; id: string }>());

// export const addUser = createAction('[List] Add User', props<{ user: List }>());
// export const upsertUser = createAction('[List] Upsert User', props<{ user: List }>());
// export const addUsers = createAction('[List] Add Users', props<{ users: List[] }>());
// export const upsertUsers = createAction('[List] Upsert Users', props<{ users: List[] }>());
// export const updateUser = createAction('[List] Update User', props<{ user: Update<List> }>());
// export const updateUsers = createAction('[List] Update Users', props<{ users: Update<List>[] }>());
// export const mapUsers = createAction('[List] Map Users', props<{ entityMap: EntityMap<List> }>());
// export const deleteUser = createAction('[List] Delete User', props<{ id: string }>());
// export const deleteUsers = createAction('[List] Delete Users', props<{ ids: string[] }>());
// export const deleteUsersByPredicate = createAction(
//   '[List] Delete Users By Predicate',
//   props<{ predicate: Predicate<List> }>()
// );
export const clearLists = createAction('[List] clear');
