import { DataGetter } from 'DataGetter/DataGetter';
import { DataStore } from 'DataStore/DataStore';
import { formatGlobalParsedData, formatUSParsedData } from 'format';
import { dateKeyToDate, dateToDateKey, parseCSV, ParsedCSV } from 'parse';
import { InternalLocationData, LocationData, ValuesOnDate } from 'types';
import { US_LOCATIONS } from 'usLocations';

interface COVID19APIOptions {
  /**
   * Whether to only load the US state and county data when it is requested.
   *
   * The US state and county data is much bigger than the global data, so it usually makes sense to
   * lazy load it for a better user experience.
   */
  lazyLoadUSData?: boolean;
  /**
   * The duration in milliseconds that the data in the data store should be valid for.
   */
  dataValidityInMS?: number;
  /**
   * Provide a callback function to receive updates on the loading status of an API instance.
   */
  onLoadingStatusChange?: (isLoading: boolean, loadingMessage?: string) => void;
}

/**
 * The super class for all the errors thrown by the API.
 */
export class COVID19APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'COVID19APIError';

    // This is needed because of:
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, COVID19APIError.prototype);
  }
}

/**
 * Thrown when a method of an instance of {@link COVID19API} is called without it being initialized
 * first.
 */
export class APINotInitializedError extends COVID19APIError {
  constructor() {
    super('The API is not initialized. Make sure to first call the `init` method.');
    this.name = 'APINotInitializedError';
    Object.setPrototypeOf(this, APINotInitializedError.prototype);
  }
}

/**
 * A class that provides a simple API for interacting with the JHU CSSE COVID-19 time series data.
 */
export default class COVID19API {
  private static defaultDataValidityInMS = 60 * 60 * 1000; // 1 hour

  private isUSDataLoaded = false;
  private isInitialized = false;

  constructor(
    private dataGetter: DataGetter,
    private dataStore: DataStore,
    private options: COVID19APIOptions = {
      lazyLoadUSData: true,
      dataValidityInMS: COVID19API.defaultDataValidityInMS,
    }
  ) {}

  private _locations: Readonly<string[]> | undefined;
  /**
   * Returns the list of locations.
   *
   * @throws {@link APINotInitializedError} Thrown when the API instance is not initialized by
   *   calling the `init` method first.
   */
  get locations(): Readonly<string[]> {
    if (this._locations == null) {
      throw new APINotInitializedError();
    }

    return this._locations;
  }

  private _sourceLastUpdatedAt: Readonly<Date> | undefined;
  /**
   * Returns the date and time the source of the data was last updated at.
   *
   * @throws {@link APINotInitializedError} Thrown when the API instance is not initialized by
   *   calling the `init` method first.
   */
  get sourceLastUpdatedAt(): Readonly<Date> {
    if (this._sourceLastUpdatedAt == null) {
      throw new APINotInitializedError();
    }

    return this._sourceLastUpdatedAt;
  }

  private _firstDate: Readonly<Date> | undefined;
  /**
   * Returns the first day of the time series data.
   *
   * @throws {@link APINotInitializedError} Thrown when the API instance is not initialized by
   *   calling the `init` method first.
   */
  get firstDate(): Readonly<Date> {
    if (this._firstDate == null) {
      throw new APINotInitializedError();
    }

    return this._firstDate;
  }

  private _lastDate: Readonly<Date> | undefined;
  /**
   * Returns the last day of the time series data.
   *
   * @throws {@link APINotInitializedError} Thrown when the API instance is not initialized by
   *   calling the `init` method first.
   */
  get lastDate(): Readonly<Date> {
    if (this._lastDate == null) {
      throw new APINotInitializedError();
    }

    return this._lastDate;
  }

  /**
   * Returns a parsed version of the given string containing comma separated values.
   *
   * @param csvPromise
   */
  private static async getParsedData(csvPromise: Promise<string>): Promise<ParsedCSV> {
    const csv = await csvPromise;

    return await parseCSV(csv);
  }

  /**
   * Initializes the API. This must be called before calling other methods.
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.dataStore.init();

    await this.loadDataIfStoreHasNoFreshData(!this.options.lazyLoadUSData);
    await this.setSourceLastUpdatedAt();
    await this.setLocations();
    await this.setFirstAndLastDates();

    this.isInitialized = true;
  }

  /**
   * Returns the location data for the given location name.
   *
   * *If the API is initialized to lazy load US data, calling this also automatically loads
   * the US data if the given location name is of a US county or state.*
   *
   * @param location The full name of the location, e.g. `"US (Autauga, Alabama)"`.
   * @throws {@link APINotInitializedError} Thrown when the API instance is not initialized by
   *   calling the `init` method first.
   * @throws {@link DataStoreInvalidLocationError} Thrown when the given location cannot be found
   *   in the store.
   */
  async getDataByLocation(location: string): Promise<LocationData> {
    return (await this.getDataByLocations([location]))[0];
  }

  /**
   * Returns the location data for the given location names.
   *
   * *If the API is initialized to lazy load US data, calling this also automatically loads
   * the US data if one of the given location names is of a US county or state.*
   *
   * @param locations An array containing the full names of the locations, e.g. `["US (Autauga,
   *   Alabama)", "Turkey"]`.
   * @throws {@link APINotInitializedError} Thrown when the API instance is not initialized by
   *   calling the `init` method first.
   * @throws {@link DataStoreInvalidLocationError} Thrown when the given location cannot be found
   *   in the store.
   */
  async getDataByLocations(locations: string[]): Promise<LocationData[]> {
    if (!this.isInitialized) {
      throw new APINotInitializedError();
    }

    // Check if the user is requesting US state or county data data.
    const loadUSData = locations.some(location => location !== 'US' && location.includes('US'));
    await this.loadDataIfStoreHasNoFreshData(loadUSData);

    const data = await this.dataStore.getLocationData(locations);

    return data.map(this.addCalculatedValues);
  }

  /**
   * Returns the location data for the given location name and date.
   *
   * *If the API is initialized to lazy load US data, calling this also automatically loads
   * the US data if the given location name is of a US county or state.*
   *
   * @param location The full name of the location, e.g. `"US (Autauga, Alabama)"`.
   * @param date
   * @returns A Promise that will resolve to a {@link ValuesOnDate} object, of `undefined` if there
   *   is no data available for the given date.
   * @throws {@link APINotInitializedError} Thrown when the API instance is not initialized by
   *   calling the `init` method first.
   * @throws {@link DataStoreInvalidLocationError} Thrown when the given location cannot be found
   *   in the store.
   */
  async getDataByLocationAndDate(location: string, date: Date): Promise<ValuesOnDate | undefined> {
    const locationData = await this.getDataByLocation(location);
    const dateStr = dateToDateKey(date);

    return locationData.values.find(dateValues => dateValues.date === dateStr);
  }

  /**
   * Checks if the data store already has data AND it is not stale, i.e. hasn't expired based on
   * the `dataValidityInMS` option.
   */
  private async hasFreshDataInStore(): Promise<boolean> {
    const savedAt = await this.dataStore.getSavedAt();
    const sourceLastUpdatedAt = await this.dataStore.getSourceLastUpdatedAt();
    const locationCount = await this.dataStore.getLocationCount();

    if (savedAt == null || sourceLastUpdatedAt == null || locationCount === 0) {
      return false;
    }

    const dataValidity = this.options.dataValidityInMS ?? COVID19API.defaultDataValidityInMS;
    const expirationTime = savedAt.getTime() + dataValidity;

    return Date.now() < expirationTime;
  }

  /**
   * The internal location data only includes confirmed cases, deaths and recoveries data. This
   * method adds extra calculated values to the data, such as new confirmed cases and mortality
   * rate.
   *
   * @param locationData
   */
  private addCalculatedValues(locationData: InternalLocationData): LocationData {
    const calculatedValues = locationData.values.map((valuesOnDate, index) => {
      let newConfirmed = 0;
      let newRecovered = null;
      let newDeaths = null;
      let recoveryRate: number | null = 0;
      let mortalityRate: number | null = 0;

      if (index > 0) {
        const { confirmed, recovered, deaths } = valuesOnDate;
        const yesterdaysData = locationData.values?.[index - 1];

        if (recovered != null && yesterdaysData?.recovered != null) {
          newRecovered = recovered - yesterdaysData.recovered;
        }

        if (deaths != null && yesterdaysData?.deaths != null) {
          newDeaths = deaths - yesterdaysData.deaths;
        }

        if (confirmed != null && yesterdaysData?.confirmed != null) {
          newConfirmed = confirmed - yesterdaysData.confirmed;
        }

        if (confirmed != null && confirmed > 0) {
          recoveryRate = recovered != null ? recovered / confirmed : null;
          mortalityRate = deaths != null ? deaths / confirmed : null;
        }
      }

      return {
        ...valuesOnDate,
        newConfirmed,
        newRecovered,
        newDeaths,
        recoveryRate,
        mortalityRate,
      };
    });

    return {
      ...locationData,
      values: calculatedValues,
    };
  }

  /**
   * Internally sets the date that the source of the data was last updated.
   *
   * When using {@link GitHubGetter}, this is the last commit date of the source CSV files.
   */
  private async setSourceLastUpdatedAt(): Promise<void> {
    this._sourceLastUpdatedAt = await this.dataStore.getSourceLastUpdatedAt();
  }

  /**
   * Internally sets the list of locations that are available in the data store, as well as the US
   * state and county location names even if they are not yet loaded, so that they can still be
   * requested even when they are lazy loaded.
   */
  private async setLocations(): Promise<void> {
    this._locations = await this.dataStore.getLocationsList();

    const someStateIndex = this._locations.indexOf('US (Alabama)');
    // If we haven't yet loaded the US state and county data,
    // add the US location names to the locations list, so that
    // the user can request them.
    if (someStateIndex === -1) {
      this._locations = [...this._locations, ...US_LOCATIONS];
    }
  }

  /**
   * Internally sets the first and the last date that the data store has data for.
   */
  private async setFirstAndLastDates(): Promise<void> {
    const someGlobalLocation = 'Australia';
    const [someGlobalLocationData] = await this.dataStore.getLocationData([someGlobalLocation]);
    const someGlobalLocationValues = someGlobalLocationData.values;

    const dataSetLength = someGlobalLocationValues.length as number;
    this._firstDate = dateKeyToDate(someGlobalLocationValues[0].date as string);
    this._lastDate = dateKeyToDate(someGlobalLocationValues[dataSetLength - 1].date as string);
  }

  /**
   * Loads data is the store does not have data or the data in the store is expired, while still
   * respecting the `lazyLoadUSData` option (unless force over-ridden).
   *
   * @param forceLoadUSData Load the US state and county data, even if the `lazyLoadUSData` option
   *   is set to `true`.
   */
  private async loadDataIfStoreHasNoFreshData(forceLoadUSData = false): Promise<void> {
    const hasFreshData = await this.hasFreshDataInStore();
    let sourceLastUpdatedAt: Date | undefined;

    if (forceLoadUSData && !this.isUSDataLoaded) {
      await this.loadUSStateAndCountyData();

      sourceLastUpdatedAt = await this.dataGetter.getSourceLastUpdatedAt();
      await this.dataStore.setSourceLastUpdatedAt(sourceLastUpdatedAt);

      if (
        (sourceLastUpdatedAt != null && sourceLastUpdatedAt.getTime() > Date.now()) ||
        !hasFreshData
      ) {
        await this.loadGlobalData();
      }

      return;
    }

    if (!hasFreshData) {
      await this.dataStore.clearData();

      await this.loadGlobalData();
      if (this.isUSDataLoaded) {
        await this.loadUSStateAndCountyData();
      }

      sourceLastUpdatedAt = await this.dataGetter.getSourceLastUpdatedAt();
      await this.dataStore.setSourceLastUpdatedAt(sourceLastUpdatedAt);
    }
  }

  /**
   * Loads the data global confirmed cases, deaths and recoveries data from the data store.
   */
  private async loadGlobalData(): Promise<void> {
    const parsedGlobalConfirmedData = await this.getParsedGlobalConfirmedData();
    const parsedGlobalDeathsData = await this.getParsedGlobalDeathsData();
    const parsedGlobalRecoveredData = await this.getParsedGlobalRecoveredData();
    const formattedGlobalData = formatGlobalParsedData(
      parsedGlobalConfirmedData,
      parsedGlobalDeathsData,
      parsedGlobalRecoveredData
    );

    await this.dataStore.putLocationData(formattedGlobalData);
  }

  /**
   * Loads the US state and county data for confirmed cases and deaths from the data store.
   */
  private async loadUSStateAndCountyData(): Promise<void> {
    const parsedUSConfirmedData = await this.getParsedUSConfirmedData();
    const parsedUSDeathsData = await this.getParsedUSDeathsData();

    const formattedUSData = formatUSParsedData(parsedUSConfirmedData, parsedUSDeathsData);

    await this.dataStore.putLocationData(formattedUSData);
    this.isUSDataLoaded = true;
  }

  private getParsedGlobalConfirmedData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getGlobalConfirmedData());

  private getParsedGlobalDeathsData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getGlobalDeathsData());

  private getParsedGlobalRecoveredData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getGlobalRecoveredData());

  private getParsedUSConfirmedData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getUSConfirmedData());

  private getParsedUSDeathsData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getUSDeathsData());
}
