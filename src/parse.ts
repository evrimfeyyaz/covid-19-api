import parse from 'csv-parse';
import { InternalLocationInfo } from 'types';
import { getFullLocationName } from 'utils';

export interface ParsedCSV {
  [location: string]: ParsedCsvRow;
}

export interface ParsedCsvRow {
  [column: string]: string | number;
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
          } else if (value === usCsvColumnTitles.countryOrRegion) {
            return columnTitles.county;
          }

          return value;
        }

        if (isDateColumn(context.column as string)) {
          return parseInt(value);
        }

        if (context.column === columnTitles.provinceOrState && value === '') {
          return undefined;
        }

        return value;
      },
    });

    const parsedCsv: ParsedCSV = {};
    parser.on('readable', () => {
      while (true) {
        const record = parser.read();

        if (record == null) {
          break;
        }

        const countryOrRegion = record[columnTitles.countryOrRegion] as string;
        const provinceOrState = record?.[columnTitles.provinceOrState] as string | undefined;
        const county = record?.[columnTitles.county] as string | undefined;

        const location = getFullLocationName(countryOrRegion, provinceOrState, county);

        parsedCsv[location] = record;
      }
    });

    parser.on('error', error => {
      reject(error);
    });

    parser.on('end', () => resolve(parsedCsv));
  });
}

export function getLocationInfoFromRow(row: ParsedCsvRow): InternalLocationInfo {
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

export function getDateKeys(parsedCsv: ParsedCSV): string[] {
  const firstLocation = Object.keys(parsedCsv)[0];
  const rowKeys = Object.keys(parsedCsv[firstLocation]);

  return rowKeys.filter(columnName => isDateColumn(columnName));
}

function isDateColumn(columnName: string): boolean {
  const dateColRegex = /^\d{1,2}\/\d{1,2}\/\d{2}$/;

  return dateColRegex.test(columnName);
}
