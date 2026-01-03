import { lastUpdated } from '../state/utils';

describe('maxModified function', () => {
  jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2021-07-08 00:00:00').valueOf());

  it('should return max date', () => {
    expect(
      lastUpdated([{ modified: new Date('2021-07-05 00:00:00') }, { modified: new Date('2021-07-04 00:00:00') }])
    ).toEqual(new Date('2021-07-05 00:00:00'));
  });

  it('should return new Date(0) when max date is older than 30 days', () => {
    expect(lastUpdated([{ modified: new Date('2021-06-08 00:00:00') }])).toEqual(new Date(0));
  });

  it('should return new Date(0) when no list is provided', () => {
    expect(lastUpdated([])).toEqual(new Date(0));
    expect(lastUpdated(null)).toEqual(new Date(0));
    expect(lastUpdated(undefined)).toEqual(new Date(0));
  });
});
