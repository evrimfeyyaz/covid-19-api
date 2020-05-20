import { COVID19APIError } from "COVID19APIError";
import { InternalLocationData } from "types";

/**
 * The super class of data store specific errors.
 */
export class DataStoreError extends COVID19APIError {
  constructor(message: string) {
    super(message);
    this.name = "DataStoreError";

    Object.setPrototypeOf(this, DataStoreError.prototype);
  }
}

/**
 * Thrown when a data store instance has not been initialized by calling the `init` method first.
 */
export class DataStoreNotInitializedError extends DataStoreError {
  constructor() {
    super("The data store is not initialized. Make sure to first call the `init` method.");
    this.name = "DataStoreNotInitializedError";

    Object.setPrototypeOf(this, DataStoreNotInitializedError.prototype);
  }
}

/**
 * Thrown when a location cannot be found in the store.
 */
export class DataStoreInvalidLocationError extends DataStoreError {
  constructor(location: string) {
    super(`Invalid location: "${location}".`);
    this.name = "DataStoreInvalidLocationError";

    Object.setPrototypeOf(this, DataStoreInvalidLocationError.prototype);
  }
}

/**
 * An interface describing a data store instance that contains the formatted formatted internal
 * location data, and allows querying it.
 */
export interface DataStore {
  /**
   * Initializes the data store. This must be called before calling other methods.
   */
  init(): Promise<void>;

  /**
   * Clears all data in the store.
   *
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  clearData(): Promise<void>;

  /**
   * Adds or overwrites the data off a location.
   *
   * @param data
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  putLocationData(data: InternalLocationData[]): Promise<void>;

  /**
   * Saves the date that the data source was last updated.
   *
   * @param sourceLastUpdatedAt The date that the data source was last updated, e.g. the last
   *   commit date for the folder containing the JHU CSSE data in its GitHub repository.
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  setSourceLastUpdatedAt(sourceLastUpdatedAt: Date | undefined): Promise<void>;

  /**
   * Returns a clone of the data for the given locations.
   *
   * @param locations An array containing full location names.
   * @throws {@link DataStoreInvalidLocationError} Thrown when one of the given locations cannot be
   *   found in the store.
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  getLocationData(locations: string[]): Promise<InternalLocationData[]>;

  /**
   * Returns a clone of the data for all of the states of the given country.
   *
   * @param countryOrRegion
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  getStatesData(countryOrRegion: string): Promise<InternalLocationData[]>;

  /**
   * Returns a clone of the data for all of the counties of the given country/state combination.
   *
   * @param countryOrRegion
   * @param provinceOrState
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  getCountiesData(
    countryOrRegion: string,
    provinceOrState: string
  ): Promise<InternalLocationData[]>;

  /**
   * Returns a clone of the list of locations in the store.
   *
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  getLocationsList(): Promise<string[]>;

  /**
   * Returns the number of locations in the store.
   *
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  getLocationCount(): Promise<number>;

  /**
   * Returns a clone of the date that a location data was last saved in the store.
   *
   * @returns `undefined` if nothing has been saved in the store yet.
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  getSavedAt(): Promise<Date | undefined>;

  /**
   * Returns a clone of the date that the source of the data was last updated.
   *
   * @throws {@link DataStoreNotInitializedError} Thrown when the data store instance has not been
   *   initialized.
   */
  getSourceLastUpdatedAt(): Promise<Date | undefined>;
}
