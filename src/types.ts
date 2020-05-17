/**
 * Defines the structure of an internally used object which contains all the data on a certain date.
 */
export interface InternalValuesOnDate {
  date: string;
  confirmed: number;
  deaths: number | null;
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
  newConfirmed: number;
  newDeaths: number | null;
  mortalityRate: number | null;
  newRecovered: number | null;
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
  values: LocationDataValues;
}
