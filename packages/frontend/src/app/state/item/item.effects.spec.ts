import { Actions } from '@ngrx/effects';
import { firstValueFrom, of } from 'rxjs';
import { ListService } from '../../list/list.service';
import { Item } from '../../shared/models';
import {
  getItemsNothingChanged,
  markItemDone,
  markItemJustAdded,
  markItemsFail,
  markItemsTodo,
  markItemTodo,
} from './item.actions';
import { markItemDone$, markItemJustAdded$, markItemsTodo$, markItemTodo$ } from './item.effects';

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

function makeListService(resolved = true): jasmine.SpyObj<ListService> {
  const spy = jasmine.createSpyObj<ListService>('ListService', ['markItemDone', 'markItemTodo', 'markItemJustAdded']);
  // Create promises lazily so a rejection only exists once a consumer awaits it
  const result = () => (resolved ? Promise.resolve() : Promise.reject(new Error('denied')));
  spy.markItemDone.and.callFake(result);
  spy.markItemTodo.and.callFake(result);
  spy.markItemJustAdded.and.callFake(result);
  return spy;
}

describe('item mark effects', () => {
  it('markItemDone$ writes via ListService and emits a no-op action on success', async () => {
    const item = makeItem();
    const listService = makeListService();
    const actions$ = of(markItemDone({ item, listId: LIST_ID })) as Actions;

    const result = await firstValueFrom(markItemDone$(actions$, listService));

    expect(listService.markItemDone).toHaveBeenCalledWith(LIST_ID, item);
    expect(result).toEqual(getItemsNothingChanged());
  });

  it('markItemDone$ emits a rollback action carrying the snapshot on failure', async () => {
    const item = makeItem();
    const listService = makeListService(false);
    const actions$ = of(markItemDone({ item, listId: LIST_ID })) as Actions;

    const result = await firstValueFrom(markItemDone$(actions$, listService));

    expect(result).toEqual(markItemsFail({ items: [item], listId: LIST_ID, error: new Error('denied') }));
  });

  it('markItemTodo$ forwards the preserveAdded flag', async () => {
    const item = makeItem({ active: false });
    const listService = makeListService();
    const actions$ = of(markItemTodo(item, LIST_ID, true)) as Actions;

    await firstValueFrom(markItemTodo$(actions$, listService));

    expect(listService.markItemTodo).toHaveBeenCalledWith(LIST_ID, item, true);
  });

  it('markItemJustAdded$ writes via ListService', async () => {
    const item = makeItem();
    const listService = makeListService();
    const actions$ = of(markItemJustAdded({ item, listId: LIST_ID })) as Actions;

    await firstValueFrom(markItemJustAdded$(actions$, listService));

    expect(listService.markItemJustAdded).toHaveBeenCalledWith(LIST_ID, item);
  });

  it('markItemsTodo$ writes every item and rolls back all snapshots on failure', async () => {
    const items = [makeItem({ id: 'a', active: false }), makeItem({ id: 'b', active: false })];
    const listService = makeListService(false);
    const actions$ = of(markItemsTodo({ items, listId: LIST_ID })) as Actions;

    const result = await firstValueFrom(markItemsTodo$(actions$, listService));

    expect(listService.markItemTodo).toHaveBeenCalledTimes(2);
    expect(result).toEqual(markItemsFail({ items, listId: LIST_ID, error: new Error('denied') }));
  });
});
