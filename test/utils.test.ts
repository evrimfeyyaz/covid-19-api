import { getFullLocationName } from '../src/utils';

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
});
