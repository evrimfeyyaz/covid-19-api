import { getFullLocationName, pushUnique } from '../src/utils';

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

  describe('pushUnique', () => {
    let arr: number[];

    beforeEach(() => {
      arr = [1, 2, 3];
    });

    it('pushes the given element into the given array if it does not exist', () => {
      pushUnique(arr, 4);

      expect(arr).toEqual([1, 2, 3, 4]);
    });

    it('does not push the given element into the given array if it exists', () => {
      pushUnique(arr, 3);

      expect(arr).toEqual([1, 2, 3]);
    });
  });
});
