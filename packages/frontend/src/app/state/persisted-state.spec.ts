import {
  normalizePersistedGroupState,
  normalizePersistedItemState,
  normalizePersistedListState,
} from './persisted-state';

describe('persisted state timestamp normalization', () => {
  const iso = '2026-07-10T15:54:00.027Z';

  it('normalizes list entity and high-water-mark dates', () => {
    const state: any = {
      ids: ['list-1'],
      entities: { 'list-1': { id: 'list-1', modified: iso } },
      lastUpdated: iso,
    };

    const normalized = normalizePersistedListState(state);

    expect(normalized.entities['list-1']!.modified).toEqual(new Date(iso));
    expect(normalized.lastUpdated).toEqual(new Date(iso));
  });

  it('normalizes item dates and drops a corrupt optional added date', () => {
    const state: any = {
      'list-1': {
        ids: ['valid', 'corrupt'],
        entities: {
          valid: { id: 'valid', modified: iso, added: { seconds: 1_783_698_840, nanoseconds: 27_000_000 } },
          corrupt: { id: 'corrupt', modified: {}, added: 'not-a-date' },
        },
        lastUpdated: { seconds: 1_783_698_840, nanoseconds: 27_000_000 },
      },
    };

    const normalized = normalizePersistedItemState(state)['list-1'];

    expect(normalized.entities['valid']!.added).toEqual(new Date(iso));
    expect(normalized.entities['corrupt']!.modified).toEqual(new Date(0));
    expect(normalized.entities['corrupt']!.added).toBeUndefined();
    expect(normalized.lastUpdated).toEqual(new Date(iso));
  });

  it('normalizes timestamps within each persisted group collection', () => {
    const state: any = {
      'list-1': {
        ids: ['group-1'],
        entities: { 'group-1': { id: 'group-1', modified: iso } },
        lastUpdated: iso,
      },
    };

    const normalized = normalizePersistedGroupState(state)['list-1'];

    expect(normalized.entities['group-1']!.modified).toEqual(new Date(iso));
    expect(normalized.lastUpdated).toEqual(new Date(iso));
  });
});
