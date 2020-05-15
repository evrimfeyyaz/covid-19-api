import {
  DataStore,
  DataStoreInvalidLocationError,
  DataStoreNotInitializedError,
} from 'DataStore/DataStore';
import { InternalLocationData } from 'types';
import { pushUnique } from 'utils';

export default class MemoryStore implements DataStore {
  private data: { [location: string]: InternalLocationData } | undefined;
  private states: { [country: string]: string[] } | undefined;
  private counties: { [country: string]: { [state: string]: string[] } } | undefined;
  private savedAt: Date | undefined;
  private lastUpdatedAt: Date | undefined;

  async init(): Promise<void> {
    this.data = {};
    this.states = {};
    this.counties = {};
  }

  async putLocationData(data: InternalLocationData[]): Promise<void> {
    if (this.data == null || this.counties == null || this.states == null) {
      throw new DataStoreNotInitializedError();
    }

    for (const locationData of data) {
      const { location, countryOrRegion, provinceOrState, county } = locationData;

      this.data[location] = locationData;

      if (provinceOrState != null && county != null) {
        if (this.counties[countryOrRegion] == null) {
          this.counties[countryOrRegion] = {};
        }

        if (this.counties[countryOrRegion][provinceOrState] == null) {
          this.counties[countryOrRegion][provinceOrState] = [];
        }

        pushUnique(this.counties[countryOrRegion][provinceOrState], location);
      } else if (provinceOrState != null) {
        if (this.states[countryOrRegion] == null) {
          this.states[countryOrRegion] = [];
        }

        pushUnique(this.states[countryOrRegion], location);
      }
    }

    this.savedAt = new Date();

    return;
  }

  async getLocationData(locations: string[]): Promise<readonly Readonly<InternalLocationData>[]> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return locations.map(location => {
      const data = this.data?.[location];

      if (data == null) {
        throw new DataStoreInvalidLocationError(location);
      }

      return data;
    });
  }

  async getLocationCount(): Promise<number> {
    return (await this.getLocationsList()).length;
  }

  async getStatesData(countryOrRegion: string): Promise<readonly Readonly<InternalLocationData>[]> {
    if (this.data == null || this.states == null) {
      throw new DataStoreNotInitializedError();
    }

    const states = this.states[countryOrRegion] ?? [];

    return states.map(location => (this.data as never)[location]);
  }

  async getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<readonly Readonly<InternalLocationData>[]> {
    if (this.data == null || this.counties == null) {
      throw new DataStoreNotInitializedError();
    }

    const counties = this.counties[countryOrRegion]?.[provinceOrState] ?? [];

    return counties.map(location => (this.data as never)[location]);
  }

  async getLocationsList(): Promise<readonly string[]> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return Object.keys(this.data);
  }

  async getSavedAt(): Promise<Readonly<Date> | undefined> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return this.savedAt;
  }

  async setLastUpdatedAt(lastUpdatedAt: Date): Promise<void> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    this.lastUpdatedAt = lastUpdatedAt;

    return;
  }

  async getLastUpdatedAt(): Promise<Readonly<Date> | undefined> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return this.lastUpdatedAt;
  }

  async clearData(): Promise<void> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    this.data = {};
    this.states = {};
    this.counties = {};
    this.savedAt = undefined;
    this.lastUpdatedAt = undefined;

    return;
  }
}
