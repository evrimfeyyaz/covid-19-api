export interface ValuesOnDate extends InternalValuesOnDate {
  newConfirmed: number;
  newDeaths: number | null;
  mortalityRate: number | null;
  newRecovered: number | null;
  recoveryRate: number | null;
}

export type LocationDataValues = ValuesOnDate[];

export interface LocationData extends InternalLocationData {
  values: LocationDataValues;
}

export interface InternalValuesOnDate {
  date: string;
  confirmed: number;
  deaths: number | null;
  recovered: number | null;
}

export type InternalLocationDataValues = InternalValuesOnDate[];

export interface InternalLocationInfo {
  location: string;
  countryOrRegion: string;
  provinceOrState?: string;
  county?: string;
  latitude: string;
  longitude: string;
}

export interface InternalLocationData extends InternalLocationInfo {
  values: InternalLocationDataValues;
}
