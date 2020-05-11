import _ from 'lodash';
import { LocationData, ValuesOnDateProperty } from 'types';

export function getFullLocationName(
  countryOrRegion: string,
  provinceOrState?: string,
  county?: string
): string {
  let location = countryOrRegion;
  let subLocation = provinceOrState;

  if (subLocation != null && county != null && subLocation.length > 0 && county.length > 0) {
    subLocation = `${county}, ${subLocation}`;
  }

  if (subLocation != null && subLocation.length > 0) {
    location = `${location} (${subLocation})`;
  }

  return location;
}

export function humanizePropertyName(propertyName: ValuesOnDateProperty): string {
  switch (propertyName) {
    case 'confirmed':
      return 'confirmed cases';
    case 'date':
      return 'date';
    case 'deaths':
      return 'deaths';
    case 'mortalityRate':
      return 'mortality rate';
    case 'newConfirmed':
      return 'new cases';
    case 'newDeaths':
      return 'new deaths';
    case 'newRecovered':
      return 'new recoveries';
    case 'recovered':
      return 'recoveries';
    case 'recoveryRate':
      return 'rate of recoveries';
  }
}

export function stripDataBeforePropertyExceedsN(
  locationData: Readonly<LocationData>,
  property: ValuesOnDateProperty,
  n: number
): LocationData {
  const dataClone = _.cloneDeep(locationData);

  return {
    ...dataClone,
    values: dataClone.values.filter(value => (value[property] ?? 0) > n),
  };
}

export function isValuesOnDateProperty(str: string): str is ValuesOnDateProperty {
  const valuesOnDateProperties: ValuesOnDateProperty[] = [
    'confirmed',
    'deaths',
    'recovered',
    'date',
    'newConfirmed',
    'newDeaths',
    'newRecovered',
    'mortalityRate',
    'recoveryRate',
  ];

  return valuesOnDateProperties.indexOf(str as never) !== -1;
}

export function dateKeyToDate(dateStr: string): Date | undefined {
  const dateParts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);

  if (dateParts == null || dateParts.length < 3) {
    return undefined;
  }

  const year = parseInt(`20${dateParts[3]}`);
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[2]);

  return new Date(year, month, day);
}

export function dateToDateKey(date: Date): string {
  const year = date
    .getFullYear()
    .toString()
    .slice(2);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = date
    .getDay()
    .toString()
    .padStart(2, '0');

  return `${year}/${month}/${day}`;
}
