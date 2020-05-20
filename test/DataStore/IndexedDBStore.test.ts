import IndexedDBStore from "../../src/DataStore/IndexedDBStore";
import { sharedDataStoreTests } from "./sharedDataStoreTests";

require("fake-indexeddb/auto");

describe("IndexedDBStore", () => {
  sharedDataStoreTests(IndexedDBStore);
});
