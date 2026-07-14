import { GroupListState } from './group/group.reducer';
import { ItemListState } from './item/item.reducer';
import { ListState } from './list/list.reducer';
import { coerceDate } from '../shared/utils';

function normalizeEntities<T extends { modified: Date; added?: Date }>(entities: Record<string, T | undefined>) {
  return Object.fromEntries(
    Object.entries(entities ?? {}).map(([id, entity]) => {
      if (!entity) return [id, entity];
      const modified = coerceDate(entity.modified) ?? new Date(0);
      const added = coerceDate(entity.added);
      const normalized = { ...entity, modified };
      if (added) {
        normalized.added = added;
      } else {
        delete normalized.added;
      }
      return [id, normalized];
    }),
  );
}

export function normalizePersistedListState(state: ListState): ListState {
  if (!state) return state;
  return {
    ...state,
    entities: normalizeEntities(state.entities as any),
    lastUpdated: coerceDate(state.lastUpdated),
  } as ListState;
}

export function normalizePersistedGroupState(state: GroupListState): GroupListState {
  if (!state) return state;
  return Object.fromEntries(
    Object.entries(state).map(([listId, groupState]) => [
      listId,
      {
        ...groupState,
        entities: normalizeEntities(groupState.entities as any),
        lastUpdated: coerceDate(groupState.lastUpdated),
      },
    ]),
  );
}

export function normalizePersistedItemState(state: ItemListState): ItemListState {
  if (!state) return state;
  return Object.fromEntries(
    Object.entries(state).map(([listId, itemState]) => [
      listId,
      {
        ...itemState,
        entities: normalizeEntities(itemState.entities as any),
        lastUpdated: coerceDate(itemState.lastUpdated),
      },
    ]),
  );
}
