import { InvalidLocationError } from '../../src/DataStore/DataStore';
import MemoryStore from '../../src/DataStore/MemoryStore';
import { internalLocationDataArray } from '../../src/testData/internalLocationData';

describe('MemoryStore', () => {
  let memoryStore: MemoryStore;
  let locations: string[];

  beforeEach(async () => {
    memoryStore = new MemoryStore();
    locations = await addTestDataToStore();
  });

  describe('put/getLocationData', () => {
    it('put and get internal location data', async () => {
      const result = await memoryStore.getLocationData(locations);

      expect(result).toHaveLength(internalLocationDataArray.length);
      expect(result).toEqual(expect.arrayContaining(internalLocationDataArray));
    });
  });

  describe('putLocationData/getSavedAt', () => {
    it('set and get the saved at info', async () => {
      const oneMinuteAgo = Date.now() - 1000 * 60;

      const result = (await memoryStore.getSavedAt()) as Date;

      // savedAt is set to less than one minute ago.
      expect(result.getTime()).toBeGreaterThan(oneMinuteAgo);
    });
  });

  describe('set/getLastUpdatedAt', () => {
    it('set and get the last updated at info', async () => {
      const lastUpdatedAt = new Date();

      await memoryStore.setLastUpdatedAt(lastUpdatedAt);
      const result = (await memoryStore.getLastUpdatedAt()) as Date;

      expect(result.getTime()).toEqual(lastUpdatedAt.getTime());
    });
  });

  describe('getLocationData', () => {
    it('throws an error when the given location cannot be found', async () => {
      const unknownLocation = 'Unknown Location';

      let error: InvalidLocationError | undefined;
      try {
        await memoryStore.getLocationData([unknownLocation]);
      } catch (e) {
        error = e;
      }

      expect(error?.name).toEqual('InvalidLocationError');
    });
  });

  describe('getStatesData', () => {
    it('returns only the data for all the states of the given country, and not county data', async () => {
      const result = await memoryStore.getStatesData('US');
      const expected = internalLocationDataArray.filter(
        d => d.county == null && d.countryOrRegion === 'US'
      );

      expect(result).toHaveLength(expected.length);
      expect(result).toEqual(expect.arrayContaining(expected));
    });

    it('throws an error when the given country cannot be found', async () => {
      const unknownCountry = 'Unknown Country';

      let error: InvalidLocationError | undefined;
      try {
        await memoryStore.getStatesData(unknownCountry);
      } catch (e) {
        error = e;
      }

      expect(error?.name).toEqual('InvalidLocationError');
    });
  });

  describe('getCountiesData', () => {
    it('returns only the data for all the counties of the given state and country, and no state data', async () => {
      const result = await memoryStore.getCountiesData('US', 'Alabama');
      const expected = internalLocationDataArray.filter(
        d => d.county != null && d.countryOrRegion === 'US' && d.provinceOrState === 'Alabama'
      );

      expect(result).toHaveLength(expected.length);
      expect(result).toEqual(expect.arrayContaining(expected));
    });

    it('throws an error when the given country/state combination cannot be found', async () => {
      const unknownCountry = 'Unknown Country';
      const unknownState = 'Unknown State';

      let error: InvalidLocationError | undefined;
      try {
        await memoryStore.getCountiesData(unknownCountry, unknownState);
      } catch (e) {
        error = e;
      }

      expect(error?.name).toEqual('InvalidLocationError');
    });
  });

  describe('getLocationList', () => {
    it('returns the list of all locations', async () => {
      const result = await memoryStore.getLocationsList();
      const expected = internalLocationDataArray.map(d => d.location);

      expect(result).toHaveLength(expected.length);
      expect(result).toEqual(expect.arrayContaining(expected));
    });
  });

  describe('getLocationCount', () => {
    it('returns the number of locations', async () => {
      const result = await memoryStore.getLocationCount();
      const expected = internalLocationDataArray.length;

      expect(result).toEqual(expected);
    });
  });

  describe('clearData', () => {
    it('clears all the location data and settings', async () => {
      await memoryStore.clearData();

      const lastUpdatedAt = await memoryStore.getLastUpdatedAt();
      const savedAt = await memoryStore.getSavedAt();
      const locationsList = await memoryStore.getLocationsList();
      const locationCount = await memoryStore.getLocationCount();

      let error: InvalidLocationError | undefined;
      try {
        await memoryStore.getLocationData(locations);
      } catch (e) {
        error = e;
      }

      expect(lastUpdatedAt).toBeUndefined();
      expect(savedAt).toBeUndefined();
      expect(locationsList).toEqual([]);
      expect(locationCount).toEqual(0);
      expect(error?.name).toEqual('InvalidLocationError');
    });
  });

  async function addTestDataToStore(): Promise<string[]> {
    await memoryStore.putLocationData(internalLocationDataArray);

    return internalLocationDataArray.map(data => data.location);
  }
});
