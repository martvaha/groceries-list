import { TestBed } from '@angular/core/testing';
import { DocumentChange, Firestore } from '@angular/fire/firestore';
import { provideMockStore } from '@ngrx/store/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { List } from '../../shared/models';
import { selectUser } from '../user/user.reducer';
import { loadListsNothingChanged, upsertListSuccess } from './list.actions';
import { selectListLastUpdated } from './list.reducer';
import { ListService } from './list.service';

describe('ListService', () => {
  const lastUpdated = new Date('2026-07-10T15:54:00.027Z');
  let changes$: Subject<DocumentChange<any>[]>;
  let service: ListService;

  beforeEach(() => {
    changes$ = new Subject<DocumentChange<any>[]>();

    TestBed.configureTestingModule({
      providers: [
        ListService,
        { provide: Firestore, useValue: {} },
        provideMockStore({
          selectors: [
            { selector: selectUser, value: { uid: 'user-1' } as any },
            { selector: selectListLastUpdated, value: lastUpdated },
          ],
        }),
      ],
    });

    service = TestBed.inject(ListService);
    spyOn(service as any, 'observeListChanges').and.returnValue(changes$);
  });

  it('emits a no-change action while an incremental query is silent', async () => {
    const result = await firstValueFrom(service.getLists());

    expect(result).toEqual([loadListsNothingChanged()]);
    expect((service as any).observeListChanges).toHaveBeenCalledWith('user-1', lastUpdated);
  });

  it('continues to emit list changes after the bootstrap no-op', () => {
    const emitted: unknown[] = [];
    const subscription = service.getLists().subscribe((actions) => emitted.push(actions));
    const modified = new Date('2026-07-11T09:00:00.000Z');
    const list = {
      id: 'list-2',
      name: 'Weekend',
      acl: ['user-1'],
      owner: 'user-1',
      modified,
      shared: false,
      favorites: [],
      groupsOrder: [],
    } as List;

    changes$.next([
      {
        type: 'added',
        doc: {
          id: list.id,
          data: () => ({
            name: list.name,
            acl: list.acl,
            owner: list.owner,
            groupsOrder: list.groupsOrder,
            modified: { toDate: () => modified },
          }),
        },
      } as DocumentChange<any>,
    ]);

    expect(emitted).toEqual([[loadListsNothingChanged()], [upsertListSuccess({ lists: [list] })]]);
    subscription.unsubscribe();
  });
});
