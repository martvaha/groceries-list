import { ActionReducerMap, createSelector, MetaReducer, ActionReducer, Action } from '@ngrx/store';
import { environment } from '../../environments/environment';
import { ListState, reducer as listReducer, selectListStateLoading, selectGroupsOrder } from './list/list.reducer';
import { localStorageSync } from 'ngrx-store-localstorage';
import { clearState } from './app.actions';
import { reducer as userReducer, UserState } from './user/user.reducer';
import { RouterState } from './router/reducer';
import { routerReducer } from '@ngrx/router-store';
import { GroupListState, reducer as groupReducer, selectAllGroups } from './group/group.reducer';
import { ItemListState, reducer as itemReducer, selectActiveItemsByGroup } from './item/item.reducer';
import { Dictionary } from '@ngrx/entity';
import { OTHERS_GROUP_ID } from '../shared/const';
import { sentryReducer } from '../shared/sentry';
import { Storage } from './utils';
import { GroupWithItems, Item } from '../shared/models';
import { ConfigState, reducer as configReducer } from './config/config.reducer';

export interface State {
  config: ConfigState;
  group: GroupListState;
  item: ItemListState;
  list: ListState;
  router: RouterState;
  user: UserState;
}

export function clearStateReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return function (state: State | undefined, action: Action) {
    if (action.type === clearState.type) {
      state = undefined;
    }

    return reducer(state, action);
  };
}

export const reducers: ActionReducerMap<State> = {
  config: configReducer,
  group: groupReducer,
  item: itemReducer,
  list: listReducer,
  router: routerReducer,
  user: userReducer,
};

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return localStorageSync({
    keys: [{ list: ['entities', 'ids', 'activeId', 'lastUpdated'] }, 'group', 'item', 'config'],
    rehydrate: true,
    removeOnUndefined: true,
    storage: new Storage(),
  })(reducer);
}

export const metaReducers: MetaReducer<State, Action>[] = !environment.production
  ? [clearStateReducer, localStorageSyncReducer, sentryReducer]
  : [clearStateReducer, localStorageSyncReducer, sentryReducer];

export const selectLoading = createSelector(selectListStateLoading, (listLoading) => listLoading);

export const selectGroupedItems = createSelector(selectAllGroups, selectActiveItemsByGroup, (groups, itemsByGroup) => {
  console.log('selectGroupedItems', groups, itemsByGroup);
  let othersGroupIndex: number | undefined;
  const itemsByGroupLocal = { ...itemsByGroup };
  const groupsWithItems = groups.map((group, index) => {
    if (group.id === OTHERS_GROUP_ID) othersGroupIndex = index;
    const items = itemsByGroupLocal[group.id] || [];
    delete itemsByGroupLocal[group.id];
    return { ...group, items, active: !!items.length } as GroupWithItems;
  });
  const unknownGroup = Object.keys(itemsByGroupLocal).reduce<Item[]>(
    (prev, cur) => [...prev, ...itemsByGroupLocal[cur]],
    []
  );
  if (othersGroupIndex !== undefined) {
    groupsWithItems[othersGroupIndex].items.push(...unknownGroup);
  } else {
    groupsWithItems.push({
      id: 'others',
      name: $localize`Other`,
      items: unknownGroup,
      modified: new Date(0),
      active: !!unknownGroup.length,
    } as GroupWithItems);
  }
  console.log('selectGroupedItems return', groupsWithItems);
  return groupsWithItems;
});

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
      .filter((groupId) => groupedItemsMap[groupId])
      .map((groupId) => groupedItemsMap[groupId] as GroupWithItems);
  }
);
