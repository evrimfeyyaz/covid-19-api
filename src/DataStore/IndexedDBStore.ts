import { DataStore } from 'DataStore/DataStore';
import { Covid19APIError, InvalidLocationError } from 'errors';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { InternalLocationData } from 'types';

interface Covid19TimeSeriesDBSchema extends DBSchema {
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

export class IndexedDBStoreNotInitializedError extends Covid19APIError {
  constructor() {
    super('You must first call `init()` to initialize the IndexedDBStore instance.');
    this.name = 'IndexedDBStoreNotInitializedError';
  }
}

export default class IndexedDBStore implements DataStore {
  savedAtKey = 'DataExpiresAt';
  lastUpdatedAtKey = 'DataLastUpdatedAt';

  private _db: IDBPDatabase<Covid19TimeSeriesDBSchema> | undefined;
  private get db(): IDBPDatabase<Covid19TimeSeriesDBSchema> {
    if (this._db == null) {
      throw new IndexedDBStoreNotInitializedError();
    }

    return this._db;
  }

  async init(): Promise<void> {
    await this.setDb();
  }

  async clearData(): Promise<void> {
    const tx = this.db.transaction(['data', 'settings'], 'readwrite');
    await tx.objectStore('data').clear();
    await tx.objectStore('settings').clear();
  }

  async getLocationData(locations: string[]): Promise<readonly Readonly<InternalLocationData>[]> {
    const dataStore = this.db.transaction('data').objectStore('data');

    const data: InternalLocationData[] = [];
    for (const location of locations) {
      const locationData = await dataStore.get(location);

      if (locationData == null) {
        throw new InvalidLocationError(location);
      }

      data.push(locationData);
    }

    return data;
  }

  async getStatesData(countryOrRegion: string): Promise<readonly Readonly<InternalLocationData>[]> {
    return await this.db.getAllFromIndex('data', 'byCountryOrRegion', countryOrRegion);
  }

  async getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<readonly Readonly<InternalLocationData>[]> {
    return (await this.db.getAllFromIndex('data', 'byProvinceOrState', provinceOrState)).filter(
      data => data.countryOrRegion === countryOrRegion
    );
  }

  async getLocationsList(): Promise<readonly string[]> {
    return await this.db.getAllKeys('data');
  }

  async getLocationCount(): Promise<number> {
    return await this.db.count('data');
  }

  async getSavedAt(): Promise<Readonly<Date> | undefined> {
    return (await this.db.get('settings', this.savedAtKey)) as Date | undefined;
  }

  async getLastUpdatedAt(): Promise<Readonly<Date> | undefined> {
    return (await this.db.get('settings', this.lastUpdatedAtKey)) as Date | undefined;
  }

  async putData(data: InternalLocationData[]): Promise<void> {
    const tx = this.db.transaction(['data', 'settings'], 'readwrite');
    const dataStore = tx.objectStore('data');

    for (const locationData of data) {
      await dataStore.put(locationData);
    }

    const settingsStore = tx.objectStore('settings');
    await settingsStore.put(new Date(), this.savedAtKey);
  }

  async setLastUpdatedAt(lastUpdatedAt: Date): Promise<void> {
    await this.db.put('settings', lastUpdatedAt, this.lastUpdatedAtKey);
  }

  private async setDb(): Promise<void> {
    const dbName = 'Covid19TimeSeriesDb';

    this._db = await openDB<Covid19TimeSeriesDBSchema>(dbName, 1, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        db.createObjectStore('data', { keyPath: 'location' });
        db.createObjectStore('settings');

        const dataStore = transaction.objectStore('data');
        dataStore.createIndex('byCountryOrRegion', 'countryOrRegion');
        dataStore.createIndex('byProvinceOrState', 'provinceOrState');
      },
    });
  }
}
