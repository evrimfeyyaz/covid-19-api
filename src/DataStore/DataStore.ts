import { InternalLocationData } from 'types';

export interface DataStore {
  init(): Promise<void>;
  clearData(): Promise<void>;
  putData(data: InternalLocationData[]): Promise<void>;
  setLastUpdatedAt(lastUpdatedAt: Date): Promise<void>;
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
