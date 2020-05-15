import { InternalLocationData } from 'types';

export class DataStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataStoreError';
    Object.setPrototypeOf(this, DataStoreError.prototype);
  }
}

export class DataStoreNotInitializedError extends DataStoreError {
  constructor() {
    super('The data store is not initialized. Make sure to first call the `init` method.');
    this.name = 'DataStoreNotInitializedError';
    Object.setPrototypeOf(this, DataStoreNotInitializedError.prototype);
  }
}

export class DataStoreInvalidLocationError extends DataStoreError {
  constructor(location: string) {
    super(`Invalid location: "${location}".`);
    this.name = 'DataStoreInvalidLocationError';
    Object.setPrototypeOf(this, DataStoreInvalidLocationError.prototype);
  }
}

export interface DataStore {
  init(): Promise<void>;
  clearData(): Promise<void>;
  putLocationData(data: InternalLocationData[]): Promise<void>;
  setLastUpdatedAt(lastUpdatedAt: Date | undefined): Promise<void>;
  getLocationData(locations: string[]): Promise<readonly Readonly<InternalLocationData>[]>;
  getStatesData(countryOrRegion: string): Promise<readonly Readonly<InternalLocationData>[]>;
  getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<readonly Readonly<InternalLocationData>[]>;
  getLocationsList(): Promise<readonly string[]>;
  getLocationCount(): Promise<number>;
  getSavedAt(): Promise<Readonly<Date> | undefined>;
  getLastUpdatedAt(): Promise<Readonly<Date> | undefined>;
}
