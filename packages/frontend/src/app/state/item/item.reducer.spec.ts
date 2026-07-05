import { Item } from '../../shared/models';
import {
  markItemDone,
  markItemJustAdded,
  markItemsFail,
  markItemsTodo,
  markItemTodo,
  removeItemsFromState,
  upsertItemListSuccess,
} from './item.actions';
import { ItemListState, reducer } from './item.reducer';

const LIST_ID = 'list-1';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'Milk',
    active: true,
    groupId: 'others',
    description: null,
    modified: new Date('2026-07-01T10:00:00Z'),
    ...overrides,
  };
}

function seed(items: Item[]): ItemListState {
  return reducer(undefined, upsertItemListSuccess({ items, listId: LIST_ID }));
}

describe('item reducer', () => {
  describe('optimistic mark actions', () => {
    it('markItemDone deactivates the item without touching lastUpdated', () => {
      const item = makeItem();
      const state = seed([item]);
      const before = state[LIST_ID].lastUpdated;

      const next = reducer(state, markItemDone({ item, listId: LIST_ID }));

      expect(next[LIST_ID].entities[item.id]?.active).toBeFalse();
      expect(next[LIST_ID].lastUpdated).toBe(before);
    });

    it('markItemTodo reactivates the item with a fresh added date', () => {
      const item = makeItem({ active: false });
      const state = seed([item]);

      const next = reducer(state, markItemTodo(item, LIST_ID));

      const updated = next[LIST_ID].entities[item.id]!;
      expect(updated.active).toBeTrue();
      expect(updated.added).toEqual(jasmine.any(Date));
      expect(next[LIST_ID].lastUpdated).toBe(state[LIST_ID].lastUpdated);
    });

    it('markItemTodo preserves the original added date when preserveAdded is set', () => {
      const added = new Date('2026-06-30T08:00:00Z');
      const item = makeItem({ active: false, added });
      const state = seed([item]);

      const next = reducer(state, markItemTodo(item, LIST_ID, true));

      expect(next[LIST_ID].entities[item.id]?.added).toBe(added);
    });

    it('markItemJustAdded resets the added date without touching lastUpdated', () => {
      const item = makeItem({ added: new Date('2026-06-28T08:00:00Z') });
      const state = seed([item]);

      const next = reducer(state, markItemJustAdded({ item, listId: LIST_ID }));

      const updated = next[LIST_ID].entities[item.id]!;
      expect(updated.added!.getTime()).toBeGreaterThan(item.added!.getTime());
      expect(next[LIST_ID].lastUpdated).toBe(state[LIST_ID].lastUpdated);
    });

    it('markItemsTodo reactivates all items in one pass', () => {
      const items = [makeItem({ id: 'a', active: false }), makeItem({ id: 'b', active: false })];
      const state = seed(items);

      const next = reducer(state, markItemsTodo({ items, listId: LIST_ID }));

      expect(next[LIST_ID].entities['a']?.active).toBeTrue();
      expect(next[LIST_ID].entities['b']?.active).toBeTrue();
      expect(next[LIST_ID].lastUpdated).toBe(state[LIST_ID].lastUpdated);
    });

    it('markItemsFail restores the snapshot, clearing an optimistic added date', () => {
      const snapshot = makeItem({ active: false });
      let state = seed([snapshot]);
      state = reducer(state, markItemTodo(snapshot, LIST_ID));
      expect(state[LIST_ID].entities[snapshot.id]?.added).toBeDefined();

      const next = reducer(state, markItemsFail({ items: [snapshot], listId: LIST_ID, error: new Error('denied') }));

      const restored = next[LIST_ID].entities[snapshot.id]!;
      expect(restored.active).toBeFalse();
      expect(restored.added).toBeUndefined();
    });
  });

  describe('lastUpdated high-water mark', () => {
    it('upsertItemListSuccess sets lastUpdated to the max server modified date', () => {
      const older = makeItem({ id: 'a', modified: new Date('2026-07-01T10:00:00Z') });
      const newer = makeItem({ id: 'b', modified: new Date('2026-07-02T10:00:00Z') });

      const state = seed([older, newer]);

      expect(state[LIST_ID].lastUpdated).toEqual(newer.modified);
    });

    it('upsertItemListSuccess never regresses lastUpdated and keeps the same reference', () => {
      const newer = makeItem({ id: 'a', modified: new Date('2026-07-02T10:00:00Z') });
      const state = seed([newer]);
      const before = state[LIST_ID].lastUpdated;

      const older = makeItem({ id: 'b', modified: new Date('2026-07-01T10:00:00Z') });
      const next = reducer(state, upsertItemListSuccess({ items: [older], listId: LIST_ID }));

      expect(next[LIST_ID].lastUpdated).toBe(before);
    });

    it('removeItemsFromState keeps the existing lastUpdated', () => {
      const item = makeItem();
      const state = seed([item]);
      const before = state[LIST_ID].lastUpdated;

      const next = reducer(state, removeItemsFromState({ listId: LIST_ID, itemIds: [item.id] }));

      expect(next[LIST_ID].entities[item.id]).toBeUndefined();
      expect(next[LIST_ID].lastUpdated).toBe(before);
    });
  });
});
