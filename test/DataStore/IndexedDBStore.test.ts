import { IDBPDatabase, openDB } from 'idb';
import { InvalidLocationError, NotInitializedError } from '../../src/DataStore/DataStore';
import IndexedDBStore from '../../src/DataStore/IndexedDBStore';
import { internalLocationDataArray } from '../../src/testData/internalLocationData';

require('fake-indexeddb/auto');

describe('IndexedDBStore', () => {
  let indexedDBStore: IndexedDBStore;

  beforeEach(() => {
    indexedDBStore = new IndexedDBStore();
  });

  describe('when initialized', () => {
    let db: IDBPDatabase;
    let locations: string[];

    beforeEach(async () => {
      const { dbName, dbVersion } = indexedDBStore;
      await indexedDBStore.init();

      db = await openDB(dbName, dbVersion);
      locations = await addTestDataToDB();
    });

    describe('putLocationData', () => {
      it('puts internal location data into the DB', async () => {
        const result = await db.getAll('data');

        expect(result).toHaveLength(internalLocationDataArray.length);
        expect(result).toEqual(expect.arrayContaining(internalLocationDataArray));
      });

      it('updates the saved at info', async () => {
        const oneMinuteAgo = Date.now() - 1000 * 60;

        const result = (await db.get('settings', indexedDBStore.savedAtKey)) as Date;

        // savedAt is set to less than one minute ago.
        expect(result.getTime()).toBeGreaterThan(oneMinuteAgo);
      });
    });

    describe('setLastUpdatedAt', () => {
      it('sets the last updated at info', async () => {
        const lastUpdatedAt = new Date();

        await indexedDBStore.setLastUpdatedAt(lastUpdatedAt);
        const result = (await db.get('settings', indexedDBStore.lastUpdatedAtKey)) as Date;

        expect(result.getTime()).toEqual(lastUpdatedAt.getTime());
      });
    });

    describe('getLocationData', () => {
      it('returns the data for the given locations', async () => {
        const result = await indexedDBStore.getLocationData(locations);

        expect(result).toHaveLength(internalLocationDataArray.length);
        expect(result).toEqual(expect.arrayContaining(internalLocationDataArray));
      });

      it('throws an error when the given location cannot be found', async () => {
        const unknownLocation = 'Unknown Location';

        let error: InvalidLocationError | undefined;
        try {
          await indexedDBStore.getLocationData([unknownLocation]);
        } catch (e) {
          error = e;
        }

        expect(error?.name).toEqual('InvalidLocationError');
      });
    });

    describe('getStatesData', () => {
      it('returns only the data for all the states of the given country, and not county data', async () => {
        const result = await indexedDBStore.getStatesData('US');
        const expected = internalLocationDataArray.filter(
          d => d.county == null && d.countryOrRegion === 'US'
        );

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });
    });

    describe('getCountiesData', () => {
      it('returns only the data for all the counties of the given state and country, and no state data', async () => {
        const result = await indexedDBStore.getCountiesData('US', 'Alabama');
        const expected = internalLocationDataArray.filter(
          d => d.county != null && d.countryOrRegion === 'US' && d.provinceOrState === 'Alabama'
        );

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });
    });

    describe('getLocationList', () => {
      it('returns the list of all locations in the DB', async () => {
        const result = await indexedDBStore.getLocationsList();
        const expected = internalLocationDataArray.map(d => d.location);

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });
    });

    describe('getLocationCount', () => {
      it('returns the number of locations in the DB', async () => {
        const result = await indexedDBStore.getLocationCount();
        const expected = internalLocationDataArray.length;

        expect(result).toEqual(expected);
      });
    });

    describe('getSavedAt', () => {
      it('returns the time of the last put operation', async () => {
        const result = await indexedDBStore.getSavedAt();
        const expected = (await db.get('settings', indexedDBStore.savedAtKey)) as Date;

        expect(result?.getTime()).toEqual(expected.getTime());
      });
    });

    describe('getLastUpdatedAt', () => {
      it('returns the time that the data was last updated by the source', async () => {
        await indexedDBStore.setLastUpdatedAt(new Date());

        const result = await indexedDBStore.getLastUpdatedAt();
        const expected = (await db.get('settings', indexedDBStore.lastUpdatedAtKey)) as Date;

        expect(result?.getTime()).toEqual(expected.getTime());
      });
    });

    describe('clearData', () => {
      it('clears all the location data and settings in the DB', async () => {
        await indexedDBStore.clearData();

        const settings = await db.getAll('settings');
        const data = await db.getAll('data');

        expect(settings).toHaveLength(0);
        expect(data).toHaveLength(0);
      });
    });

    async function addTestDataToDB(): Promise<string[]> {
      await indexedDBStore.putLocationData(internalLocationDataArray);

      return internalLocationDataArray.map(data => data.location);
    }
  });

  describe('when not initialized', () => {
    it('throws an error when trying to read data', async () => {
      let error: NotInitializedError | undefined;
      try {
        await indexedDBStore.getLocationData([internalLocationDataArray[0].location]);
      } catch (e) {
        error = e;
      }

      expect(error?.name).toEqual('NotInitializedError');
    });

    it('throws an error when trying to write data', async () => {
      let error: NotInitializedError | undefined;
      try {
        await indexedDBStore.putLocationData(internalLocationDataArray);
      } catch (e) {
        error = e;
      }

      expect(error?.name).toEqual('NotInitializedError');
    });
  });
});
