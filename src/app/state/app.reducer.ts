import { ActionReducerMap, createSelector, MetaReducer, ActionReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import {
  ListState,
  reducer as listReducer,
  selectListStateLoading,
  selectGroupsOrder,
  selectActiveList
} from './list/list.reducer';
import { localStorageSync } from 'ngrx-store-localstorage';
import { clearState } from './app.actions';
import { reducer as userReducer, UserState } from './user/user.reducer';
import { RouterState } from './router/reducer';
import { routerReducer } from '@ngrx/router-store';
import { GroupListState, reducer as groupReducer, selectAllGroups } from './group/group.reducer';
import { ItemListState, reducer as itemReducer, selectAllItems, selectActiveItemsByGroup } from './item/item.reducer';
import { GroupWithItems } from '../list-container/list-container.component';
import { Dictionary } from '@ngrx/entity';
import { OTHERS_GROUP_ID } from '../shared/const';
import { Item } from '../shared/models';
import { sentryReducer } from '../shared/sentry';

export interface State {
  list: ListState;
  user: UserState;
  router: RouterState;
  group: GroupListState;
  item: ItemListState;
}

export function clearStateReducer(reducer) {
  return function(state, action) {
    if (action.type === clearState.type) {
      state = undefined;
    }

    return reducer(state, action);
  };
}

export const reducers: ActionReducerMap<State> = {
  list: listReducer,
  user: userReducer,
  router: routerReducer,
  group: groupReducer,
  item: itemReducer
};

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return localStorageSync({
    keys: [{ list: ['entities', 'ids'] }, 'group', 'item'],
    rehydrate: true,
    removeOnUndefined: true
  })(reducer);
}

export const metaReducers: MetaReducer<State>[] = !environment.production
  ? [clearStateReducer, localStorageSyncReducer, sentryReducer]
  : [clearStateReducer, localStorageSyncReducer, sentryReducer];

export const selectLoading = createSelector(
  selectListStateLoading,
  listLoading => listLoading
);

export const selectGroupedItems = createSelector(
  selectAllGroups,
  selectActiveItemsByGroup,
  (groups, itemsByGroup) => {
    console.log('selectGroupedItems', groups, itemsByGroup);
    let othersGroupIndex: number | undefined;
    const itemsByGroupLocal = { ...itemsByGroup };
    const groupsWithItems = groups.map((group, index) => {
      if (group.id === OTHERS_GROUP_ID) othersGroupIndex = index;
      const items = itemsByGroupLocal[group.id] || [];
      delete itemsByGroupLocal[group.id];
      return { ...group, items, active: !!items.length } as GroupWithItems;
    });
    const unknownGroup = Object.keys(itemsByGroupLocal).reduce((prev, cur) => [...prev, ...itemsByGroupLocal[cur]], []);
    if (othersGroupIndex !== undefined) {
      groupsWithItems[othersGroupIndex].items.push(...unknownGroup);
    } else {
      groupsWithItems.push({
        id: 'others',
        name: 'Muu',
        items: unknownGroup,
        modified: new Date(0),
        active: !!unknownGroup.length
      } as GroupWithItems);
    }
    console.log('selectGroupedItems return', groupsWithItems);
    return groupsWithItems;
  }
);

export const selectOrderedGroupedItems = createSelector(
  selectGroupedItems,
  selectGroupsOrder,
  (groupedItems, groupsOrder) => {
    if (!groupsOrder) return groupedItems;
    const groupedItemsMap: Dictionary<GroupWithItems> = groupedItems.reduce(
      (prev, cur) => ({ ...prev, [cur.id]: cur }),
      {}
    );
    const orderedUnion = [...new Set([...groupsOrder, ...Object.keys(groupedItemsMap)])];
    return orderedUnion
      .filter(groupId => groupedItemsMap[groupId])
      .map(groupId => groupedItemsMap[groupId] as GroupWithItems);
  }
);
