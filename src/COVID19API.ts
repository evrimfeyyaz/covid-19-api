import { DataGetter } from 'DataGetter/DataGetter';
import { DataStore } from 'DataStore/DataStore';
import { NotInitializedError, PersistedDataAnomalyError } from 'errors';
import { formatGlobalParsedData, formatUSParsedData } from 'format';
import { dateKeyToDate, dateToDateKey, parseCSV, ParsedCSV } from 'parse';
import { InternalLocationData, LocationData, ValuesOnDate } from 'types';
import { US_LOCATIONS } from 'usLocations';

interface COVID19APIOptions {
  lazyLoadUSData: boolean;
  dataValidityInMS: number;
  onLoadingStatusChange?: (isLoading: boolean, loadingMessage?: string) => void;
}

export default class COVID19API {
  private isGlobalDataLoaded = false;
  private isUSDataLoaded = false;

  constructor(
    private dataGetter: DataGetter,
    private dataStore: DataStore,
    private options: COVID19APIOptions = {
      lazyLoadUSData: true,
      dataValidityInMS: 60 * 60 * 1000, // 1 hour
    }
  ) {}

  private _locations: Readonly<string[]> | undefined;
  get locations(): Readonly<string[]> {
    if (this._locations == null) {
      throw new NotInitializedError();
    }

    return this._locations;
  }

  private _lastUpdatedAt: Readonly<Date> | undefined;
  get lastUpdatedAt(): Readonly<Date> {
    if (this._lastUpdatedAt == null) {
      throw new NotInitializedError();
    }

    return this._lastUpdatedAt;
  }

  private _firstDate: Readonly<Date> | undefined;
  get firstDate(): Readonly<Date> {
    if (this._firstDate == null) {
      throw new NotInitializedError();
    }

    return this._firstDate;
  }

  private _lastDate: Readonly<Date> | undefined;
  get lastDate(): Readonly<Date> {
    if (this._lastDate == null) {
      throw new NotInitializedError();
    }

    return this._lastDate;
  }

  private static async getParsedData(csvPromise: Promise<string>): Promise<ParsedCSV> {
    const csv = await csvPromise;

    return await parseCSV(csv);
  }

  async init(): Promise<void> {
    await this.dataStore.init();

    const hasFreshData = await this.hasFreshDataInStore();

    if (!hasFreshData) {
      await this.clearData();
      await this.loadData(!this.options.lazyLoadUSData);
    }
  }

  async getDataByLocation(location: string): Promise<LocationData> {
    return (await this.getDataByLocations([location]))[0];
  }

  async getDataByLocations(locations: string[]): Promise<LocationData[]> {
    // Check if the user is requesting US state data while it
    // is not yet loaded.
    const requestingUSData = locations.some(location => location.includes('US'));
    if (!this.isUSDataLoaded && requestingUSData) {
      await this.loadData(true);
    }

    const data = await this.dataStore.getLocationData(locations);

    return data.map(this.addCalculatedValues);
  }

  async getDataByLocationAndDate(location: string, date: Date): Promise<ValuesOnDate> {
    const locationData = await this.getDataByLocation(location);
    const dateStr = dateToDateKey(date);

    const data = locationData.values.find(dateValues => dateValues.date === dateStr);

    if (data == null) {
      throw new Error(`Cannot find any data for ${date.toDateString()}`);
    }

    return data;
  }

  private async hasFreshDataInStore(): Promise<boolean> {
    const savedAt = await this.dataStore.getSavedAt();
    const lastUpdatedAt = await this.dataStore.getLastUpdatedAt();
    const locationCount = await this.dataStore.getLocationCount();

    if (savedAt == null || lastUpdatedAt == null || locationCount === 0) {
      return false;
    }

    const expirationTime = savedAt.getTime() + this.options.dataValidityInMS;

    return Date.now() < expirationTime;
  }

  private async clearData(): Promise<void> {
    await this.dataStore.clearData();
    this.isGlobalDataLoaded = false;
    this.isUSDataLoaded = false;
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

  private async setLastUpdatedAt(): Promise<void> {
    this._lastUpdatedAt = await this.dataStore.getLastUpdatedAt();

    if (this._lastUpdatedAt == null) {
      throw new PersistedDataAnomalyError();
    }
  }

  private async setLocations(): Promise<void> {
    this._locations = await this.dataStore.getLocationsList();

    const usIndex = this._locations.indexOf('US');
    // If we haven't yet loaded the US data, add the US
    // location names to the locations list, so that the
    // user can request them.
    if (!this._locations[usIndex + 1].includes('US')) {
      this._locations = [
        ...this._locations.slice(0, usIndex + 1),
        ...US_LOCATIONS,
        ...this._locations.slice(usIndex + 1),
      ];
    }
  }

  private async setFirstAndLastDates(): Promise<void> {
    const firstLocation = this.locations[0];
    const [firstLocationData] = await this.dataStore.getLocationData([firstLocation]);
    const firstLocationValues = firstLocationData.values;

    const dataSetLength = firstLocationValues.length as number;
    this._firstDate = dateKeyToDate(firstLocationValues[0].date as string);
    this._lastDate = dateKeyToDate(firstLocationValues[dataSetLength - 1].date as string);
  }

  private async loadData(loadUSData = false): Promise<void> {
    const dataLastUpdated = await this.dataGetter.getLastUpdatedAt();

    let isCurrentDataStale = true;
    if (this._lastUpdatedAt != null) {
      isCurrentDataStale = dataLastUpdated.getTime() > this._lastUpdatedAt.getTime();
    }

    if (!this.isGlobalDataLoaded || isCurrentDataStale) {
      await this.loadGlobalData();
    }

    if (loadUSData && (!this.isUSDataLoaded || isCurrentDataStale)) {
      await this.loadUSStateAndCountyData();
    }

    await this.dataStore.setLastUpdatedAt(dataLastUpdated);
    await this.setLastUpdatedAt();
    await this.setLocations();
    await this.setFirstAndLastDates();
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
    this.isGlobalDataLoaded = true;
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
