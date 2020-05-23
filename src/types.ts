/**
 * Defines the structure of an internally used object which contains all the data on a certain date.
 */
export interface InternalValuesOnDate {
  /**
   * The date of the values.
   */
  date: string;
  /**
   * The number of confirmed cases.
   */
  confirmed: number;
  /**
   * The number of deaths. `null` if this information is not available.
   */
  deaths: number | null;
  /**
   * The number of recoveries. `null` if this information is not available.
   */
  recovered: number | null;
}

/**
 * Defines an internally used array of objects which contain all the data on a certain date.
 */
export type InternalLocationDataValues = InternalValuesOnDate[];

/**
 * Defines the structure of an internally used object which contains all the COVID-19 related
 * values and information for a certain location.
 */
export interface InternalLocationData extends LocationInfo {
  /**
   * All the values for this location by date.
   */
  values: InternalLocationDataValues;
}

/**
 * Defines the structure of an object which contains the information on a certain location.
 */
export interface LocationInfo {
  location: string;
  countryOrRegion: string;
  provinceOrState?: string;
  county?: string;
  latitude: string;
  longitude: string;
}

/**
 * Defines the structure of an object which contains all the data on a certain date.
 */
export interface ValuesOnDate extends InternalValuesOnDate {
  /**
   * The number of new confirmed cases on this date.
   */
  newConfirmed: number;
  /**
   * The number of new deaths on this date. `null` if this information is not available.
   */
  newDeaths: number | null;
  /**
   * The mortality rate on this date. `null` if this information is not available.
   */
  mortalityRate: number | null;
  /**
   * The number of new recoveries on this date. `null` if this information is not available.
   */
  newRecovered: number | null;
  /**
   * The recovery rate out of all confirmed cases.
   */
  recoveryRate: number | null;
}

/**
 * Defines an array of objects which contain all the data on a certain date.
 */
export type LocationDataValues = ValuesOnDate[];

/**
 * Defines the structure of an object which contains all the COVID-19 related values and
 * information for a certain location.
 */
export interface LocationData extends InternalLocationData {
  /**
   * All the values for this location by date.
   */
  values: LocationDataValues;
}

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
