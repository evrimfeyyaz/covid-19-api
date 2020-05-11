import { dateKeyToDate, dateToDateKey, getFullLocationName } from '../src/utils';

describe('utils', () => {
  describe('getFullLocationName', () => {
    const country = 'US';
    const state = 'New York';
    const county = 'Ontario';

    it('returns the full location name when a country is given', () => {
      const result = getFullLocationName(country);

      expect(result).toEqual('US');
    });

    it('returns the full location name when a country and state are given', () => {
      const result = getFullLocationName(country, state);

      expect(result).toEqual('US (New York)');
    });

    it('returns the full location name when a country, state and county are given', () => {
      const result = getFullLocationName(country, state, county);

      expect(result).toEqual('US (Ontario, New York)');
    });
  });

  describe('dateKeyToDate', () => {
    it('returns given date key as a Date object', () => {
      const dateStr = `05/31/20`;

      const result = dateKeyToDate(dateStr) as Date;
      const expected = new Date(2020, 4, 31);

      expect(result.getTime()).toEqual(expected.getTime());
    });

    it('returns `undefined` when a non-date key string is given', () => {
      const wrongStr = 'wrong';

      const result = dateKeyToDate(wrongStr);

      expect(result).toBeUndefined();
    });
  });

  describe('dateToDateKey', () => {
    it('returns the date key representation of given Date', () => {
      const date = new Date(2020, 4, 31);

      const result = dateToDateKey(date);
      const expected = '05/31/20';

      expect(result).toEqual(expected);
    });
  });
});
