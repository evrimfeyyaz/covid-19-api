import parse from 'csv-parse';
import { InternalLocationInfo } from 'types';
import { getFullLocationName } from 'utils';

export interface ParsedCSV {
  [location: string]: ParsedCSVRow;
}

export interface ParsedCSVRow {
  [column: string]: string | number | undefined;
}

const columnTitles = {
  countryOrRegion: 'Country/Region',
  provinceOrState: 'Province/State',
  latitude: 'Lat',
  longitude: 'Long',
  county: 'County',
  population: 'Population',
};

const usCsvColumnTitles = {
  countryOrRegion: 'Country_Region',
  provinceOrState: 'Province_State',
  county: 'Admin2',
  longitude: 'Long_',
};

const dateKeyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;

export async function parseCSV(csv: string): Promise<ParsedCSV> {
  return new Promise<ParsedCSV>((resolve, reject) => {
    const parser = parse(csv, {
      columns: true,
      trim: true,
      cast: (value, context) => {
        if (context.header) {
          // The CSV files containing the US county data have different column names than the
          // files containing the global data, so we match the US data column names to the
          // global data column names.
          if (value === usCsvColumnTitles.provinceOrState) {
            return columnTitles.provinceOrState;
          } else if (value === usCsvColumnTitles.countryOrRegion) {
            return columnTitles.countryOrRegion;
          } else if (value === usCsvColumnTitles.longitude) {
            return columnTitles.longitude;
          } else if (value === usCsvColumnTitles.county) {
            return columnTitles.county;
          }

          return value;
        }

        if (isDateKey(context.column as string)) {
          return parseInt(value);
        }

        if (context.column === columnTitles.provinceOrState && value === '') {
          return undefined;
        }

        if (context.column === columnTitles.county && value === '') {
          return undefined;
        }

        return value;
      },
    });

    const parsedCSV: ParsedCSV = {};
    parser.on('readable', () => {
      while (true) {
        const record = parser.read();

        if (record == null) {
          break;
        }

        const countryOrRegion = record[columnTitles.countryOrRegion] as string;
        const provinceOrState = record[columnTitles.provinceOrState] as string | undefined;
        const county = record[columnTitles.county] as string | undefined;

        const location = getFullLocationName(countryOrRegion, provinceOrState, county);

        parsedCSV[location] = record;
      }
    });

    parser.on('error', error => {
      reject(error);
    });

    parser.on('end', () => resolve(parsedCSV));
  });
}

export function getLocationInfoFromRow(row: ParsedCSVRow): InternalLocationInfo {
  const countryOrRegion = row[columnTitles.countryOrRegion] as string;
  const provinceOrState = row[columnTitles.provinceOrState] as string | undefined;
  const county = row[columnTitles.county] as string | undefined;
  const location = getFullLocationName(countryOrRegion, provinceOrState, county);
  const latitude = row[columnTitles.latitude] as string;
  const longitude = row[columnTitles.longitude] as string;

  return {
    location,
    countryOrRegion,
    provinceOrState,
    county,
    latitude,
    longitude,
  };
}

export function getDateKeys(parsedCSV: ParsedCSV): string[] {
  const firstLocation = Object.keys(parsedCSV)[0];
  const rowKeys = Object.keys(parsedCSV[firstLocation]);

  return rowKeys.filter(columnName => isDateKey(columnName));
}

export function dateKeyToDate(dateStr: string): Date | undefined {
  const dateParts = dateStr.match(dateKeyRegex);

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
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();

  return `${month}/${day}/${year}`;
}

function isDateKey(columnName: string): boolean {
  return dateKeyRegex.test(columnName);
}
