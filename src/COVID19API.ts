import { DataGetter } from 'DataGetter/DataGetter';
import { DataStore } from 'DataStore/DataStore';
import { formatGlobalParsedData, formatUSParsedData } from 'format';
import { dateKeyToDate, dateToDateKey, parseCSV, ParsedCSV } from 'parse';
import { InternalLocationData, LocationData, ValuesOnDate } from 'types';
import { US_LOCATIONS } from 'usLocations';

interface COVID19APIOptions {
  lazyLoadUSData?: boolean;
  dataValidityInMS?: number;
  onLoadingStatusChange?: (isLoading: boolean, loadingMessage?: string) => void;
}

export class COVID19APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'COVID19APIError';

    // This is needed because of:
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, COVID19APIError.prototype);
  }
}

export class APINotInitializedError extends COVID19APIError {
  constructor() {
    super('The API is not initialized. Make sure to first call the `init` method.');
    this.name = 'APINotInitializedError';
    Object.setPrototypeOf(this, APINotInitializedError.prototype);
  }
}

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
   */
  get locations(): Readonly<string[]> {
    if (this._locations == null) {
      throw new APINotInitializedError();
    }

    return this._locations;
  }

  private _sourceLastUpdatedAt: Readonly<Date> | undefined;
  get sourceLastUpdatedAt(): Readonly<Date> {
    if (this._sourceLastUpdatedAt == null) {
      throw new APINotInitializedError();
    }

    return this._sourceLastUpdatedAt;
  }

  private _firstDate: Readonly<Date> | undefined;
  get firstDate(): Readonly<Date> {
    if (this._firstDate == null) {
      throw new APINotInitializedError();
    }

    return this._firstDate;
  }

  private _lastDate: Readonly<Date> | undefined;
  get lastDate(): Readonly<Date> {
    if (this._lastDate == null) {
      throw new APINotInitializedError();
    }

    return this._lastDate;
  }

  private static async getParsedData(csvPromise: Promise<string>): Promise<ParsedCSV> {
    const csv = await csvPromise;

    return await parseCSV(csv);
  }

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

  async getDataByLocation(location: string): Promise<LocationData> {
    return (await this.getDataByLocations([location]))[0];
  }

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

  async getDataByLocationAndDate(location: string, date: Date): Promise<ValuesOnDate | undefined> {
    const locationData = await this.getDataByLocation(location);
    const dateStr = dateToDateKey(date);

    return locationData.values.find(dateValues => dateValues.date === dateStr);
  }

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

  private async setSourceLastUpdatedAt(): Promise<void> {
    this._sourceLastUpdatedAt = await this.dataStore.getSourceLastUpdatedAt();
  }

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

  private async setFirstAndLastDates(): Promise<void> {
    const someGlobalLocation = 'Australia';
    const [someGlobalLocationData] = await this.dataStore.getLocationData([someGlobalLocation]);
    const someGlobalLocationValues = someGlobalLocationData.values;

    const dataSetLength = someGlobalLocationValues.length as number;
    this._firstDate = dateKeyToDate(someGlobalLocationValues[0].date as string);
    this._lastDate = dateKeyToDate(someGlobalLocationValues[dataSetLength - 1].date as string);
  }

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
