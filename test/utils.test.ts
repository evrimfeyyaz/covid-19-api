import { cloneInternalLocationData, getFullLocationName, pushUnique } from '../src/utils';
import { internalLocationDataArray } from './testData/internalLocationData';

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

  describe('cloneInternalLocationData', () => {
    it('clones the given internal location data object', () => {
      const data = internalLocationDataArray[0];

      const clone = cloneInternalLocationData(data);
      clone.location = 'Unknown';
      clone.provinceOrState = 'Unknown';
      clone.countryOrRegion = 'Unknown';
      clone.county = 'Unknown';
      clone.latitude = 'Unknown';
      clone.longitude = 'Unknown';
      clone.values[0].confirmed = data.values[0].confirmed + 1;
      clone.values.pop();

      expect(data.location).not.toEqual(clone.location);
      expect(data.provinceOrState).not.toEqual(clone.provinceOrState);
      expect(data.countryOrRegion).not.toEqual(clone.countryOrRegion);
      expect(data.county).not.toEqual(clone.county);
      expect(data.longitude).not.toEqual(clone.longitude);
      expect(data.latitude).not.toEqual(clone.latitude);
      expect(data.values[0].confirmed).not.toEqual(clone.values[0].confirmed);
      expect(data.values).not.toHaveLength(clone.values.length);
    });
  });
});
