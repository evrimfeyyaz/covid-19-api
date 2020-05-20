import {
  DataStore,
  DataStoreInvalidLocationError,
  DataStoreNotInitializedError,
} from "./DataStore";
import { InternalLocationData } from "../types";
import { cloneInternalLocationData, pushUnique } from "../utils";

/**
 * A data store that saves to and loads from the memory.
 *
 * For more information about its methods see {@link DataStore}.
 */
export class MemoryStore implements DataStore {
  private data: { [location: string]: InternalLocationData } | undefined;
  private states: { [country: string]: string[] } | undefined;
  private counties: { [country: string]: { [state: string]: string[] } } | undefined;
  private savedAt: Date | undefined;
  private sourceLastUpdatedAt: Date | undefined;

  async init(): Promise<void> {
    if (this.data != null) {
      return;
    }

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

  async getLocationData(locations: string[]): Promise<InternalLocationData[]> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return locations.map((location) => {
      const data = this.data?.[location];

      if (data == null) {
        throw new DataStoreInvalidLocationError(location);
      }

      return cloneInternalLocationData(data);
    });
  }

  async getLocationCount(): Promise<number> {
    return (await this.getLocationsList()).length;
  }

  async getStatesData(countryOrRegion: string): Promise<InternalLocationData[]> {
    if (this.data == null || this.states == null) {
      throw new DataStoreNotInitializedError();
    }

    const states = this.states[countryOrRegion] ?? [];

    return states.map((location) => cloneInternalLocationData((this.data as never)[location]));
  }

  async getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<InternalLocationData[]> {
    if (this.data == null || this.counties == null) {
      throw new DataStoreNotInitializedError();
    }

    const counties = this.counties[countryOrRegion]?.[provinceOrState] ?? [];

    return counties.map((location) => cloneInternalLocationData((this.data as never)[location]));
  }

  async getLocationsList(): Promise<string[]> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return Object.keys(this.data);
  }

  async getSavedAt(): Promise<Date | undefined> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return this.savedAt ? new Date(this.savedAt.getTime()) : undefined;
  }

  async setSourceLastUpdatedAt(sourceLastUpdatedAt: Date): Promise<void> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    this.sourceLastUpdatedAt = sourceLastUpdatedAt;

    return;
  }

  async getSourceLastUpdatedAt(): Promise<Date | undefined> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    return this.sourceLastUpdatedAt ? new Date(this.sourceLastUpdatedAt.getTime()) : undefined;
  }

  async clearData(): Promise<void> {
    if (this.data == null) {
      throw new DataStoreNotInitializedError();
    }

    this.data = {};
    this.states = {};
    this.counties = {};
    this.savedAt = undefined;
    this.sourceLastUpdatedAt = undefined;

    return;
  }
}
