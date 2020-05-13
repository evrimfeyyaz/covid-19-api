import IndexedDBStore, { IndexedDBNotInitializedError } from '../../src/DataStore/IndexedDBStore';
import { internalLocationDataArray } from '../../src/testData/internalLocationData';
import { sharedDataStoreTests } from '../../src/testData/sharedDataStoreTests';

require('fake-indexeddb/auto');

describe('IndexedDBStore', () => {
  const indexedDBStore = new IndexedDBStore();

  describe('when initialized', () => {
    sharedDataStoreTests('IndexedDBStore', indexedDBStore, async () => {
      await indexedDBStore.init();
    });
  });

  describe('when not initialized', () => {
    it('throws an error when trying to read data', async () => {
      let error: IndexedDBNotInitializedError | undefined;
      try {
        await indexedDBStore.getLocationData([internalLocationDataArray[0].location]);
      } catch (e) {
        error = e;
      }

      expect(error?.name).toEqual('IndexedDBNotInitializedError');
    });

    it('throws an error when trying to write data', async () => {
      let error: IndexedDBNotInitializedError | undefined;
      try {
        await indexedDBStore.putLocationData(internalLocationDataArray);
      } catch (e) {
        error = e;
      }

      expect(error?.name).toEqual('IndexedDBNotInitializedError');
    });
  });
});
