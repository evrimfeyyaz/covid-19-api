import { DataStore, InvalidLocationError } from '../DataStore/DataStore';
import { internalLocationDataArray } from './internalLocationData';

export async function sharedDataStoreTests(
  storeName: string,
  store: DataStore,
  doBeforeEach: () => Promise<void>
): Promise<void> {
  describe(storeName, () => {
    let locations: string[];

    beforeEach(async () => {
      await doBeforeEach();
      locations = await addTestDataToStore();
    });

    describe('put/getLocationData', () => {
      it('put and get internal location data', async () => {
        const result = await store.getLocationData(locations);

        expect(result).toHaveLength(internalLocationDataArray.length);
        expect(result).toEqual(expect.arrayContaining(internalLocationDataArray));
      });
    });

    describe('putLocationData/getSavedAt', () => {
      it('set and get the saved at info', async () => {
        const oneMinuteAgo = Date.now() - 1000 * 60;

        const result = (await store.getSavedAt()) as Date;

        // savedAt is set to less than one minute ago.
        expect(result.getTime()).toBeGreaterThan(oneMinuteAgo);
      });
    });

    describe('set/getLastUpdatedAt', () => {
      it('set and get the last updated at info', async () => {
        const lastUpdatedAt = new Date();

        await store.setLastUpdatedAt(lastUpdatedAt);
        const result = (await store.getLastUpdatedAt()) as Date;

        expect(result.getTime()).toEqual(lastUpdatedAt.getTime());
      });
    });

    describe('getLocationData', () => {
      it('throws an error when the given location cannot be found', async () => {
        const unknownLocation = 'Unknown Location';

        let error: InvalidLocationError | undefined;
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

      it('throws an error when the given country cannot be found', async () => {
        const unknownCountry = 'Unknown Country';

        let error: InvalidLocationError | undefined;
        try {
          await store.getStatesData(unknownCountry);
        } catch (e) {
          error = e;
        }

        expect(error?.name).toEqual('InvalidLocationError');
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

      it('throws an error when the given country/state combination cannot be found', async () => {
        const unknownCountry = 'Unknown Country';
        const unknownState = 'Unknown State';

        let error: InvalidLocationError | undefined;
        try {
          await store.getCountiesData(unknownCountry, unknownState);
        } catch (e) {
          error = e;
        }

        expect(error?.name).toEqual('InvalidLocationError');
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

        let error: InvalidLocationError | undefined;
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
}
