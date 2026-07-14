import { lastUpdated } from '../state/utils';
import { coerceDate } from './utils';

describe('coerceDate', () => {
  const iso = '2026-07-10T15:54:00.027Z';

  it('keeps valid Date instances', () => {
    const date = new Date(iso);
    expect(coerceDate(date)).toBe(date);
  });

  it('restores ISO strings and serialized Firestore timestamps', () => {
    expect(coerceDate(iso)).toEqual(new Date(iso));
    expect(coerceDate({ seconds: 1_783_698_840, nanoseconds: 27_000_000 })).toEqual(new Date(iso));
    expect(coerceDate({ _seconds: 1_783_698_840, _nanoseconds: 27_000_000 })).toEqual(new Date(iso));
  });

  it('uses a Firestore Timestamp toDate method', () => {
    expect(coerceDate({ toDate: () => new Date(iso) })).toEqual(new Date(iso));
  });

  it('returns null for invalid and hostile values', () => {
    expect(coerceDate('not-a-date')).toBeNull();
    expect(coerceDate(new Date('invalid'))).toBeNull();
    expect(
      coerceDate({
        toDate: () => {
          throw new Error('corrupt');
        },
      }),
    ).toBeNull();
    expect(coerceDate({})).toBeNull();
  });
});

describe('lastUpdated function', () => {
  it('should return the stored date when it is recent', () => {
    const recent = new Date(Date.now() - 60_000);
    expect(lastUpdated({ lastUpdated: recent })).toBe(recent);
  });

  it('should return new Date(0) when the stored date is older than the full reload timeout', () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    expect(lastUpdated({ lastUpdated: old })).toEqual(new Date(0));
  });

  it('should return new Date(0) when no date is stored', () => {
    expect(lastUpdated({})).toEqual(new Date(0));
    expect(lastUpdated({ lastUpdated: null })).toEqual(new Date(0));
  });

  it('should safely reset malformed persisted dates', () => {
    expect(lastUpdated({ lastUpdated: 'corrupt' })).toEqual(new Date(0));
  });
});
