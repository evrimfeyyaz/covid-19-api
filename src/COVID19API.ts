import { COVID19APIError } from "./COVID19APIError";
import { DataGetter } from "./DataGetter/DataGetter";
import { FileGetter } from "./DataGetter/FileGetter";
import { GitHubGetter } from "./DataGetter/GitHubGetter";
import { DataStore, DataStoreInvalidLocationError } from "./DataStore/DataStore";
import { IndexedDBStore } from "./DataStore/IndexedDBStore";
import { MemoryStore } from "./DataStore/MemoryStore";
import { formatGlobalParsedData, formatUSParsedData } from "./format";
import { dateKeyToDate, dateToDateKey, parseCSV, ParsedCSV } from "./parse";
import { Fetch, InternalLocationData, LocationData, ValuesOnDate } from "./types";
import { US_LOCATIONS } from "./usLocations";

type LoadFromOptions = "github" | "files";
type StoreOptions = "memory" | "indexeddb";
type FilePaths = {
  globalConfirmedCSVPath: string;
  globalDeathsCSVPath: string;
  globalRecoveredCSVPath: string;
  usConfirmedCSVPath: string;
  usDeathsCSVPath: string;
};

export interface COVID19APIOptions {
  /**
   * Where to load the data from. Either the JHU CSSE GitHub repository or from CSV files.
   *
   * The default is `"github"`.
   */
  loadFrom?: LoadFromOptions;
  /**
   * Where to store the data, and query it from. Either memory or IndexedDB.
   *
   * The default is `"memory"`.
   */
  store?: StoreOptions;
  /**
   * If `"files"` is selected for the `loadFrom` option, you can optionally enter the paths to the
   * CSV files.
   *
   * If this is omitted, it is assumed that the files are in the same folder, and have the
   * following default names:
   *
   * - time_series_covid19_confirmed_global.csv
   * - time_series_covid19_deaths_global.csv
   * - time_series_covid19_recovered_global.csv
   * - time_series_covid19_confirmed_US.csv
   * - time_series_covid19_deaths_US.csv
   */
  filePaths?: FilePaths;
  /**
   * Whether to only load the US state and county data when it is requested.
   *
   * The US state and county data is much bigger than the global data, so it usually makes sense to
   * lazy load it for a better user experience.
   *
   * The default is `true`.
   */
  lazyLoadUSData?: boolean;
  /**
   * The duration in milliseconds that the data in the data store should be valid for.
   *
   * After this duration, the data is automatically re-fetched either from GitHub or reloaded from
   * local files, depending on the `loadFrom` option.
   *
   * The default is 1 hour.
   */
  dataValidityInMS?: number;
  /**
   * The `fetch` function to use, mainly needed for NodeJS. When this is not provided, it is
   * assumed that there is a `fetch` function in the global object.
   */
  fetch?: Fetch;
  /**
   * Provide a callback function to receive updates on the loading status of an API instance.
   */
  onLoadingStatusChange?: (isLoading: boolean, loadingMessage?: string) => void;
}

/**
 * Thrown when a method or property of an instance of {@link COVID19API} is called without it being
 * initialized first.
 */
export class COVID19APINotInitializedError extends COVID19APIError {
  constructor() {
    super("The COVID-19 API is not initialized. Make sure to first call the `init` method.");
    this.name = "COVID19APINotInitializedError";
    Object.setPrototypeOf(this, COVID19APINotInitializedError.prototype);
  }
}

/**
 * Thrown when `init` is called more than once.
 */
export class COVID19APIAlreadyInitializedError extends COVID19APIError {
  constructor() {
    super("The COVID-19 API is already initialized.");
    this.name = "COVID19APIAlreadyInitializedError";
    Object.setPrototypeOf(this, COVID19APIAlreadyInitializedError.prototype);
  }
}

/**
 * A class that provides a simple API for interacting with the JHU CSSE COVID-19 time series data.
 */
export class COVID19API {
  private readonly dataValidityInMS: number;
  private readonly lazyLoadUSData: boolean;
  private readonly onLoadingStatusChange:
    | ((isLoading: boolean, loadingMessage?: string) => void)
    | undefined;

  private shouldLoadUSData = false;
  private isInitialized = false;

  private readonly dataStore: DataStore;
  private readonly dataGetter: DataGetter;

  constructor(options: COVID19APIOptions = {}) {
    const { lazyLoadUSData, dataValidityInMS, onLoadingStatusChange, fetch } = options;

    this.lazyLoadUSData = lazyLoadUSData ?? true;
    this.dataValidityInMS = dataValidityInMS ?? 60 * 60 * 1000; // 1 hour
    this.onLoadingStatusChange = onLoadingStatusChange;

    let { store, loadFrom, filePaths } = options;

    store = store ?? "memory";
    loadFrom = loadFrom ?? "github";
    filePaths = filePaths ?? {
      globalConfirmedCSVPath: "time_series_covid19_confirmed_global.csv",
      globalDeathsCSVPath: "time_series_covid19_deaths_global.csv",
      globalRecoveredCSVPath: "time_series_covid19_recovered_global.csv",
      usConfirmedCSVPath: "time_series_covid19_confirmed_US.csv",
      usDeathsCSVPath: "time_series_covid19_deaths_US.csv",
    };

    switch (store) {
      case "indexeddb":
        this.dataStore = new IndexedDBStore();
        break;
      case "memory":
        this.dataStore = new MemoryStore();
    }

    switch (loadFrom) {
      case "files":
        this.dataGetter = new FileGetter(
          filePaths.globalConfirmedCSVPath,
          filePaths.globalDeathsCSVPath,
          filePaths.globalRecoveredCSVPath,
          filePaths.usConfirmedCSVPath,
          filePaths.usDeathsCSVPath
        );
        break;
      case "github":
        this.dataGetter = new GitHubGetter(fetch);
    }
  }

  private _locations: string[] | undefined;
  /**
   * Returns the list of locations in the JHU CSSE dataset.
   *
   * @throws {@link COVID19APINotInitializedError} Thrown when the API instance is not initialized
   *   by calling the `init` method first.
   */
  get locations(): string[] {
    if (this._locations == null) {
      throw new COVID19APINotInitializedError();
    }

    return [...this._locations];
  }

  private _sourceLastUpdatedAt: Date | undefined;
  /**
   * Returns the date and time the source of the data was last updated at.
   *
   * If the data getter is not able to get the date that the source was last updated on, it might
   * return `undefined`.
   *
   * @throws {@link COVID19APINotInitializedError} Thrown when the API instance is not initialized
   *   by calling the `init` method first.
   */
  get sourceLastUpdatedAt(): Date | undefined {
    if (!this.isInitialized) {
      throw new COVID19APINotInitializedError();
    }

    return this._sourceLastUpdatedAt ? new Date(this._sourceLastUpdatedAt.getTime()) : undefined;
  }

  private _firstDate: Date | undefined;
  /**
   * Returns the first day of the time series data.
   *
   * @throws {@link COVID19APINotInitializedError} Thrown when the API instance is not initialized
   *   by calling the `init` method first.
   */
  get firstDate(): Date {
    if (this._firstDate == null) {
      throw new COVID19APINotInitializedError();
    }

    return new Date(this._firstDate.getTime());
  }

  private _lastDate: Date | undefined;
  /**
   * Returns the last day of the time series data.
   *
   * @throws {@link COVID19APINotInitializedError} Thrown when the API instance is not initialized
   *   by calling the `init` method first.
   */
  get lastDate(): Date {
    if (this._lastDate == null) {
      throw new COVID19APINotInitializedError();
    }

    return new Date(this._lastDate.getTime());
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
   *
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   * @throws {@link COVID19APIAlreadyInitializedError} Thrown when this method is called more than
   *   once.
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      throw new COVID19APIAlreadyInitializedError();
    }

    await this.dataStore.init();

    await this.setShouldLoadUSData();
    await this.loadDataIfStoreHasNoFreshData();
    await this.setSourceLastUpdatedAt();
    await this.setLocations();
    await this.setFirstAndLastDates();

    this.isInitialized = true;
  }

  /**
   * Returns the location data for the given location name.
   *
   * *If the API is initialized to lazy load the US data, calling this also automatically loads
   * the US data if the given location name is of a US county or state.*
   *
   * @param location The full name of the location, e.g. `"US (Autauga, Alabama)"`.
   * @throws {@link COVID19APINotInitializedError} Thrown when the API instance is not initialized
   *   by calling the `init` method first.
   * @throws {@link DataStoreInvalidLocationError} Thrown when the given location cannot be found
   *   in the store.
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  async getDataByLocation(location: string): Promise<LocationData> {
    return (await this.getDataByLocations([location]))[0];
  }

  /**
   * Returns the location data for the given location names.
   *
   * *If the API is initialized to lazy load the US data, calling this also automatically loads
   * the US data if one of the given location names is of a US county or state.*
   *
   * @param locations An array containing the full names of the locations, e.g. `["US (Autauga,
   *   Alabama)", "Turkey"]`.
   * @throws {@link COVID19APINotInitializedError} Thrown when the API instance is not initialized
   *   by calling the `init` method first.
   * @throws {@link DataStoreInvalidLocationError} Thrown when the given location cannot be found
   *   in the store.
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  async getDataByLocations(locations: string[]): Promise<LocationData[]> {
    if (!this.isInitialized) {
      throw new COVID19APINotInitializedError();
    }

    // Check if the user is requesting US state or county data.
    if (locations.some((location) => location !== "US" && location.includes("US"))) {
      this.shouldLoadUSData = true;
    }
    await this.loadDataIfStoreHasNoFreshData();

    const data = await this.dataStore.getLocationData(locations);

    return data.map(this.addCalculatedValues);
  }

  /**
   * Returns the location data for the given location name and date.
   *
   * *If the API is initialized to lazy load the US data, calling this also automatically loads
   * the US data if the given location name is of a US county or state.*
   *
   * @param location The full name of the location, e.g. `"US (Autauga, Alabama)"`.
   * @param date
   * @returns A Promise that will resolve to a {@link ValuesOnDate} object, of `undefined` if there
   *   is no data available for the given date.
   * @throws {@link COVID19APINotInitializedError} Thrown when the API instance is not initialized
   *   by calling the `init` method first.
   * @throws {@link DataStoreInvalidLocationError} Thrown when the given location cannot be found
   *   in the store.
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  async getDataByLocationAndDate(location: string, date: Date): Promise<ValuesOnDate | undefined> {
    const locationData = await this.getDataByLocation(location);
    const dateStr = dateToDateKey(date);

    return locationData.values.find((dateValues) => dateValues.date === dateStr);
  }

  /**
   * Checks if the data store already has data AND it is not stale, i.e. hasn't expired based on
   * the `dataValidityInMS` option.
   */
  private async hasFreshDataInStore(): Promise<boolean> {
    const savedAt = await this.dataStore.getSavedAt();
    const locationCount = await this.dataStore.getLocationCount();

    if (savedAt == null || locationCount === 0) {
      return false;
    }

    const dataValidity = this.dataValidityInMS;
    const expirationTime = savedAt.getTime() + dataValidity;

    return Date.now() < expirationTime;
  }

  /**
   * Decide whether or not the US county-level data should be loaded.
   *
   * If the data already exists in the store, or if the `lazyLoadUSData` option is `false`, then
   * load the US data.
   */
  private async setShouldLoadUSData(): Promise<void> {
    const hasUSData = await this.hasUSDataInStore();

    this.shouldLoadUSData = !this.lazyLoadUSData || hasUSData;
  }

  /**
   * Returns `true` if the data store already has US county-level data.
   */
  private async hasUSDataInStore(): Promise<boolean> {
    try {
      const someUSCounty = "US (Autauga, Alabama)";
      await this.dataStore.getLocationData([someUSCounty]);

      return true;
    } catch (e) {
      if (e instanceof DataStoreInvalidLocationError) {
        return false;
      }

      throw e;
    }
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

    const someStateIndex = this._locations.indexOf("US (Alabama)");
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
    const someGlobalLocation = "Australia";
    const [someGlobalLocationData] = await this.dataStore.getLocationData([someGlobalLocation]);
    const someGlobalLocationValues = someGlobalLocationData.values;

    const dataSetLength = someGlobalLocationValues.length as number;
    this._firstDate = dateKeyToDate(someGlobalLocationValues[0].date as string);
    this._lastDate = dateKeyToDate(someGlobalLocationValues[dataSetLength - 1].date as string);
  }

  /**
   * Loads data if the store does not have data or the data in the store is expired.
   *
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private async loadDataIfStoreHasNoFreshData(): Promise<void> {
    const hasFreshData = await this.hasFreshDataInStore();
    const hasUSData = await this.hasUSDataInStore();
    let sourceLastUpdatedAt: Date | undefined;

    if (!hasUSData && this.shouldLoadUSData) {
      await this.loadUSStateAndCountyData();

      sourceLastUpdatedAt = await this.dataGetter.getSourceLastUpdatedAt();
      await this.dataStore.setSourceLastUpdatedAt(sourceLastUpdatedAt);

      if (
        (sourceLastUpdatedAt != null && sourceLastUpdatedAt.getTime() > Date.now()) ||
        !hasFreshData
      ) {
        await this.loadGlobalData();
      }

      this.onLoadingStatusChange?.(false);

      return;
    }

    if (!hasFreshData) {
      await this.dataStore.clearData();

      await this.loadGlobalData();
      if (this.shouldLoadUSData) {
        await this.loadUSStateAndCountyData();
      }

      sourceLastUpdatedAt = await this.dataGetter.getSourceLastUpdatedAt();
      await this.dataStore.setSourceLastUpdatedAt(sourceLastUpdatedAt);

      this.onLoadingStatusChange?.(false);
    }
  }

  /**
   * Loads the data global confirmed cases, deaths and recoveries data from the data store.
   *
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private async loadGlobalData(): Promise<void> {
    this.onLoadingStatusChange?.(true, "Loading the global data.");
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
   *
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private async loadUSStateAndCountyData(): Promise<void> {
    this.onLoadingStatusChange?.(true, "Loading the US data. This might take a little while.");
    const parsedUSConfirmedData = await this.getParsedUSConfirmedData();
    const parsedUSDeathsData = await this.getParsedUSDeathsData();

    const formattedUSData = formatUSParsedData(parsedUSConfirmedData, parsedUSDeathsData);

    await this.dataStore.putLocationData(formattedUSData);
    this.shouldLoadUSData = false;
  }

  /**
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private getParsedGlobalConfirmedData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getGlobalConfirmedData());

  /**
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private getParsedGlobalDeathsData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getGlobalDeathsData());

  /**
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private getParsedGlobalRecoveredData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getGlobalRecoveredData());

  /**
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private getParsedUSConfirmedData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getUSConfirmedData());

  /**
   * @throws {@link DataGetterError} Thrown when there is an error getting the data.
   */
  private getParsedUSDeathsData = (): Promise<ParsedCSV> =>
    COVID19API.getParsedData(this.dataGetter.getUSDeathsData());
}
