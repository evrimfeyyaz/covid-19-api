import {
  DataStore,
  DataStoreInvalidLocationError,
  DataStoreNotInitializedError,
} from "DataStore/DataStore";
import { DBSchema, IDBPDatabase, openDB } from "idb";
import { InternalLocationData } from "types";

interface COVID19TimeSeriesDBSchema extends DBSchema {
  settings: {
    key: string;
    value: unknown;
  };
  data: {
    key: string;
    value: InternalLocationData;
    indexes: {
      byCountryOrRegion: string;
      byProvinceOrState: string;
    };
  };
}

/**
 * A data store that saves to and loads from an IndexedDB database.
 *
 * For more information about its methods see {@link DataStore}.
 */
export default class IndexedDBStore implements DataStore {
  readonly savedAtKey = "DataSavedAt";
  readonly sourceLastUpdatedAtKey = "DataSourceLastUpdatedAt";
  readonly dbName = "COVID19TimeSeriesDB";
  readonly dbVersion = 1;

  private _db: IDBPDatabase<COVID19TimeSeriesDBSchema> | undefined;
  private get db(): IDBPDatabase<COVID19TimeSeriesDBSchema> {
    if (this._db == null) {
      throw new DataStoreNotInitializedError();
    }

    return this._db;
  }

  async init(): Promise<void> {
    await this.setDB();
  }

  async clearData(): Promise<void> {
    const tx = this.db.transaction(["data", "settings"], "readwrite");
    await tx.objectStore("data").clear();
    await tx.objectStore("settings").clear();
  }

  async getLocationData(locations: string[]): Promise<InternalLocationData[]> {
    const dataStore = this.db.transaction("data").objectStore("data");

    const data: InternalLocationData[] = [];
    for (const location of locations) {
      const locationData = await dataStore.get(location);

      if (locationData == null) {
        throw new DataStoreInvalidLocationError(location);
      }

      data.push(locationData);
    }

    return data;
  }

  async getStatesData(countryOrRegion: string): Promise<InternalLocationData[]> {
    const countiesAndStates = await this.db.getAllFromIndex(
      "data",
      "byCountryOrRegion",
      countryOrRegion
    );

    return countiesAndStates.filter((s) => s.county == null);
  }

  async getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<InternalLocationData[]> {
    const countiesAndState = await this.db.getAllFromIndex(
      "data",
      "byProvinceOrState",
      provinceOrState
    );

    return countiesAndState.filter(
      (data) => data.countryOrRegion === countryOrRegion && data.county != null
    );
  }

  async getLocationsList(): Promise<string[]> {
    return await this.db.getAllKeys("data");
  }

  async getLocationCount(): Promise<number> {
    return await this.db.count("data");
  }

  async getSavedAt(): Promise<Date | undefined> {
    return (await this.db.get("settings", this.savedAtKey)) as Date | undefined;
  }

  async getSourceLastUpdatedAt(): Promise<Date | undefined> {
    return (await this.db.get("settings", this.sourceLastUpdatedAtKey)) as Date | undefined;
  }

  async putLocationData(data: InternalLocationData[]): Promise<void> {
    const tx = this.db.transaction(["data", "settings"], "readwrite");
    const dataStore = tx.objectStore("data");

    for (const locationData of data) {
      await dataStore.put(locationData);
    }

    const settingsStore = tx.objectStore("settings");
    await settingsStore.put(new Date(), this.savedAtKey);
  }

  async setSourceLastUpdatedAt(lastUpdatedAt: Date): Promise<void> {
    await this.db.put("settings", lastUpdatedAt, this.sourceLastUpdatedAtKey);
  }

  /**
   * Opens an IndexedDB connection.
   *
   * If the database is not yet created, it also creates it. If the database exists but is an older
   * version, it upgrades it.
   */
  private async setDB(): Promise<void> {
    this._db = await openDB<COVID19TimeSeriesDBSchema>(this.dbName, this.dbVersion, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        db.createObjectStore("data", { keyPath: "location" });
        db.createObjectStore("settings");

        const dataStore = transaction.objectStore("data");
        dataStore.createIndex("byCountryOrRegion", "countryOrRegion");
        dataStore.createIndex("byProvinceOrState", "provinceOrState");
      },
    });
  }
}
