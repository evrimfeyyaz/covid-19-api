import { DataStore } from 'DataStore/DataStore';
import { InternalLocationData } from 'types';

export default class MemoryStore implements DataStore {
  init(): Promise<void> {
    return Promise.resolve(undefined);
  }

  clearData(): Promise<void> {
    return Promise.resolve(undefined);
  }

  getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<readonly Readonly<InternalLocationData>[]> {
    return Promise.resolve([]);
  }

  getLastUpdatedAt(): Promise<Readonly<Date> | undefined> {
    return Promise.resolve(undefined);
  }

  getLocationCount(): Promise<number> {
    return Promise.resolve(0);
  }

  getLocationData(locations: string[]): Promise<readonly Readonly<InternalLocationData>[]> {
    return Promise.resolve([]);
  }

  getLocationsList(): Promise<readonly string[]> {
    return Promise.resolve([]);
  }

  getSavedAt(): Promise<Readonly<Date> | undefined> {
    return Promise.resolve(undefined);
  }

  getStatesData(countryOrRegion: string): Promise<readonly Readonly<InternalLocationData>[]> {
    return Promise.resolve([]);
  }

  putLocationData(data: InternalLocationData[]): Promise<void> {
    return Promise.resolve(undefined);
  }

  setLastUpdatedAt(lastUpdatedAt: Date): Promise<void> {
    return Promise.resolve(undefined);
  }
}
