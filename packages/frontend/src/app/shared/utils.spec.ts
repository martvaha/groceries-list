import { lastUpdated } from '../state/utils';

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
});
