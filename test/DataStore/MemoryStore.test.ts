import MemoryStore from "../../src/DataStore/MemoryStore";
import { sharedDataStoreTests } from "./sharedDataStoreTests";

describe("MemoryStore", () => {
  sharedDataStoreTests(MemoryStore);
});
