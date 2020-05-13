import MemoryStore from '../../src/DataStore/MemoryStore';
import { sharedInitializedDataStoreTests } from '../../src/testData/sharedInitializedDataStoreTests';

describe('MemoryStore', () => {
  sharedInitializedDataStoreTests(MemoryStore);
});
