import { DataStore, InvalidLocationError } from 'DataStore/DataStore';
import { InternalLocationData } from 'types';
import { pushUnique } from 'utils';

export default class MemoryStore implements DataStore {
  private data: { [location: string]: InternalLocationData } = {};
  private states: { [country: string]: string[] } = {};
  private counties: { [country: string]: { [state: string]: string[] } } = {};
  private savedAt: Date | undefined;
  private lastUpdatedAt: Date | undefined;

  async init(): Promise<void> {
    return;
  }

  async putLocationData(data: InternalLocationData[]): Promise<void> {
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
    return locations.map(location => {
      const data = this.data[location];

      if (data == null) {
        throw new InvalidLocationError(location);
      }

      return data;
    });
  }

  async getLocationCount(): Promise<number> {
    return (await this.getLocationsList()).length;
  }

  async getStatesData(countryOrRegion: string): Promise<readonly Readonly<InternalLocationData>[]> {
    const states = this.states[countryOrRegion] ?? [];

    return states.map(location => this.data[location]);
  }

  async getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<readonly Readonly<InternalLocationData>[]> {
    const counties = this.counties[countryOrRegion]?.[provinceOrState] ?? [];

    return counties.map(location => this.data[location]);
  }

  async getLocationsList(): Promise<readonly string[]> {
    return Object.keys(this.data);
  }

  async getSavedAt(): Promise<Readonly<Date> | undefined> {
    return this.savedAt;
  }

  async setLastUpdatedAt(lastUpdatedAt: Date): Promise<void> {
    this.lastUpdatedAt = lastUpdatedAt;

    return;
  }

  async getLastUpdatedAt(): Promise<Readonly<Date> | undefined> {
    return this.lastUpdatedAt;
  }

  async clearData(): Promise<void> {
    this.data = {};
    this.states = {};
    this.counties = {};
    this.savedAt = undefined;
    this.lastUpdatedAt = undefined;

    return;
  }
}
