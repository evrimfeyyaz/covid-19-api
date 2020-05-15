import {
  DataStore,
  DataStoreInvalidLocationError,
  DataStoreNotInitializedError,
} from '../../src/DataStore/DataStore';
import { InternalLocationData } from '../../src/types';
import { internalLocationDataArray } from '../testData/internalLocationData';

export async function sharedDataStoreTests<T extends DataStore>(
  dataStoreConstructor: new () => T
): Promise<void> {
  describe('when initialized', () => {
    let locations: string[];
    let store: T;

    beforeAll(async () => {
      store = new dataStoreConstructor();
      await store.init();
      locations = await addTestDataToStore();
    });

    it('allows putting and getting internal location data', async () => {
      const result = await store.getLocationData(locations);

      expect(result).toHaveLength(internalLocationDataArray.length);
      expect(result).toEqual(expect.arrayContaining(internalLocationDataArray));
    });

    it('allows setting and getting the saved at info', async () => {
      const oneMinuteAgo = Date.now() - 1000 * 60;

      const result = (await store.getSavedAt()) as Date;

      // savedAt is set to less than one minute ago.
      expect(result.getTime()).toBeGreaterThan(oneMinuteAgo);
    });

    it('allows setting and getting the last updated at info', async () => {
      const lastUpdatedAt = new Date();

      await store.setLastUpdatedAt(lastUpdatedAt);
      const result = (await store.getLastUpdatedAt()) as Date;

      expect(result.getTime()).toEqual(lastUpdatedAt.getTime());
    });

    it('replaces existing locations when putting locations', async () => {
      const existingData: InternalLocationData = {
        ...internalLocationDataArray.filter(({ location }) => location === 'Turkey')[0],
        values: [],
      };
      await store.putLocationData([existingData]);

      const [turkeyData] = await store.getLocationData(['Turkey']);
      const locations = await store.getLocationsList();

      expect(turkeyData.values).toEqual([]);
      expect(locations.filter(location => location === 'Turkey')).toHaveLength(1);
    });

    describe('getLocationData', () => {
      it('throws an error when the given location cannot be found', async () => {
        const unknownLocation = 'Unknown Location';

        let error: DataStoreInvalidLocationError | undefined;
        try {
          await store.getLocationData([unknownLocation]);
        } catch (e) {
          error = e;
        }

        expect(error?.name).toEqual('InvalidLocationError');
      });
    });

    describe('getStatesData', () => {
      it('returns only the data for all the states of the given country, and not county data', async () => {
        const result = await store.getStatesData('US');
        const expected = internalLocationDataArray.filter(
          d => d.county == null && d.countryOrRegion === 'US'
        );

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });

      it('returns an empty array when no state for the given country can be found', async () => {
        const result = await store.getStatesData('Unknown');

        expect(result).toHaveLength(0);
      });
    });

    describe('getCountiesData', () => {
      it('returns only the data for all the counties of the given state and country, and no state data', async () => {
        const result = await store.getCountiesData('US', 'Alabama');
        const expected = internalLocationDataArray.filter(
          d => d.county != null && d.countryOrRegion === 'US' && d.provinceOrState === 'Alabama'
        );

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });

      it('returns an empty array when no county for the given country/state combination can be found', async () => {
        const result = await store.getCountiesData('Unknown', 'Unknown');

        expect(result).toHaveLength(0);
      });
    });

    describe('getLocationList', () => {
      it('returns the list of all locations', async () => {
        const result = await store.getLocationsList();
        const expected = internalLocationDataArray.map(d => d.location);

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });
    });

    describe('getLocationCount', () => {
      it('returns the number of locations', async () => {
        const result = await store.getLocationCount();
        const expected = internalLocationDataArray.length;

        expect(result).toEqual(expected);
      });
    });

    describe('clearData', () => {
      it('clears all the location data and settings', async () => {
        await store.clearData();

        const lastUpdatedAt = await store.getLastUpdatedAt();
        const savedAt = await store.getSavedAt();
        const locationsList = await store.getLocationsList();
        const locationCount = await store.getLocationCount();

        let error: DataStoreInvalidLocationError | undefined;
        try {
          await store.getLocationData(locations);
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
      await store.putLocationData(internalLocationDataArray);

      return internalLocationDataArray.map(data => data.location);
    }
  });

  describe('when not initialized', () => {
    let store: T;

    beforeAll(async () => {
      store = new dataStoreConstructor();
    });

    describe('putLocationData', () => {
      it('throws not initialized error', async () => {
        await expect(store.putLocationData([])).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('getLocationData', () => {
      it('throws not initialized error', async () => {
        await expect(store.getLocationData([])).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('getStatesData', () => {
      it('throws not initialized error', async () => {
        await expect(store.getStatesData('')).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('getCountiesData', () => {
      it('throws not initialized error', async () => {
        await expect(store.getCountiesData('', '')).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('getLocationsList', () => {
      it('throws not initialized error', async () => {
        await expect(store.getLocationsList()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('getLocationCount', () => {
      it('throws not initialized error', async () => {
        await expect(store.getLocationCount()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('getLastUpdatedAt', () => {
      it('throws not initialized error', async () => {
        await expect(store.getLastUpdatedAt()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('getSavedAt', () => {
      it('throws not initialized error', async () => {
        await expect(store.getSavedAt()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe('clearData', () => {
      it('throws not initialized error', async () => {
        await expect(store.clearData()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });
  });
}
