import parse from "csv-parse";
import { LocationInfo } from "./types";
import { getFullLocationName } from "./utils";

export interface ParsedCSV {
  [location: string]: ParsedCSVRow;
}

export interface ParsedCSVRow {
  [column: string]: string | number | undefined;
}

/**
 * The column names in global data CSV files.
 */
const globalCSVColumnTitles = {
  countryOrRegion: "Country/Region",
  provinceOrState: "Province/State",
  latitude: "Lat",
  longitude: "Long",
};

/**
 * The column names in US data CSV files.
 */
const usCSVColumnTitles = {
  countryOrRegion: "Country_Region",
  provinceOrState: "Province_State",
  county: "Admin2",
  longitude: "Long_",
};

/**
 * The column names to use in parsed data objects.
 */
const columnTitles = {
  ...globalCSVColumnTitles,
  county: "County",
  population: "Population",
};

/**
 * The format of the date columns in the CSV files is "month/day/year", e.g. "1/2/20" for
 * January 2, 2020. This is the regular expression for parsing them.
 */
const dateKeyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;

/**
 * Returns an object containing the location information in a {@link ParsedCSVRow}.
 *
 * @param row
 */
export function getLocationInfoFromRow(row: ParsedCSVRow): LocationInfo {
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

/**
 * Converts a string containing a date to a Date object, if it is in the right format,
 * such as "1/2/20".
 *
 * @param dateKey A string containing a date in the format "month/date/year", e.g. "1/2/20".
 */
export function dateKeyToDate(dateKey: string): Date | undefined {
  const dateParts = dateKey.match(dateKeyRegex);

  if (dateParts == null || dateParts.length < 3) {
    return undefined;
  }

  const year = parseInt(`20${dateParts[3]}`);
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[2]);

  return new Date(year, month, day);
}

/**
 * Converts the given Date object to a string in "month/day/year" format, e.g. "1/2/20".
 *
 * @param date
 */
export function dateToDateKey(date: Date): string {
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();

  return `${month}/${day}/${year}`;
}

/**
 * Returns `true` if the given column name is a date.
 *
 * @param columnName
 */
function isDateKey(columnName: string): boolean {
  return dateKeyRegex.test(columnName);
}

/**
 * The CSV files containing the US county data have different column names than the files
 * containing the global data. This method converts the US data column names to the ones we
 * internally use (see {@link columnTitles}.
 *
 * @param columnName
 */
function getProperColumnName(columnName: string): string {
  switch (columnName) {
    case usCSVColumnTitles.provinceOrState:
      return columnTitles.provinceOrState;
    case usCSVColumnTitles.countryOrRegion:
      return columnTitles.countryOrRegion;
    case usCSVColumnTitles.longitude:
      return columnTitles.longitude;
    case usCSVColumnTitles.county:
      return columnTitles.county;
    default:
      return columnName;
  }
}

/**
 * Returns a function that the CSV parser can use to read each line of a CSV file and accumulate
 * the read data in the given object.
 *
 * @param parser
 * @param parsedCSV The {@link ParsedCSV} object that each read line is accumulated into.
 */
function getParserReadListener(parser: parse.Parser, parsedCSV: ParsedCSV): () => void {
  return (): void => {
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
  };
}

/**
 * Casts the values read by the CSV reader to the correct types, and unifies column names used in
 * different files.
 *
 * @param value
 * @param context
 */
function castCSVData(value: string, context: parse.CastingContext): unknown {
  if (context.header) {
    return getProperColumnName(value);
  }

  if (isDateKey(context.column as string)) {
    return parseInt(value);
  }

  if (
    value === "" &&
    (context.column === columnTitles.provinceOrState || context.column === columnTitles.county)
  ) {
    return undefined;
  }

  return value;
}

/**
 * Parses the contents of a CSV file from the JHU CSSE time series data.
 *
 * @param csv
 */
export async function parseCSV(csv: string): Promise<ParsedCSV> {
  return new Promise<ParsedCSV>((resolve, reject) => {
    const parser = parse(csv, {
      columns: true,
      trim: true,
      cast: castCSVData,
    });

    const parsedCSV: ParsedCSV = {};
    parser.on("readable", getParserReadListener(parser, parsedCSV));

    parser.on("error", (error) => {
      reject(error);
    });

    parser.on("end", () => resolve(parsedCSV));
  });
}

/**
 * Returns the keys of a {@link ParsedCSV} that are dates.
 *
 * @param parsedCSV
 */
export function getDateKeys(parsedCSV: ParsedCSV): string[] {
  const firstLocation = Object.keys(parsedCSV)[0];
  const rowKeys = Object.keys(parsedCSV[firstLocation]);

  return rowKeys.filter((columnName) => isDateKey(columnName));
}
