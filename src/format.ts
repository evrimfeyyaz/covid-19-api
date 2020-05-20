import { getDateKeys, getLocationInfoFromRow, ParsedCSV, ParsedCSVRow } from "./parse";
import { InternalLocationData, InternalLocationDataValues } from "./types";
import { getFullLocationName } from "./utils";
import { US_STATES } from "./usStates";

/**
 * Sums confirmed cases, deaths and recoveries in the given {@link InternalLocationData} objects.
 *
 * @param data
 */
function sumMultipleLocationValues(data: InternalLocationData[]): InternalLocationDataValues {
  let sum: InternalLocationDataValues = [];

  data.forEach(({ values }, index) => {
    if (index === 0) {
      sum = [...values];
      return;
    }

    values.forEach((valuesOnDate, index) => {
      const totalValuesOnDate = sum[index];
      const { date, confirmed, deaths, recovered } = valuesOnDate;
      const totalConfirmed = confirmed + totalValuesOnDate.confirmed;

      let totalDeaths = totalValuesOnDate.deaths;
      if (deaths != null) {
        totalDeaths = (totalDeaths ?? 0) + deaths;
      }

      let totalRecovered = totalValuesOnDate.recovered;
      if (recovered != null) {
        totalRecovered = (totalRecovered ?? 0) + recovered;
      }

      sum[index] = {
        date,
        confirmed: totalConfirmed,
        deaths: totalDeaths,
        recovered: totalRecovered,
      };
    });
  });

  return sum;
}

/**
 * Calculates the data for Australia.
 *
 * *The values for Australia are represented separately for each state in the JHU CSSE data. This
 * function calculates the country totals by summing the data for all the states in Australia.*
 *
 * @param australiaStateData {@link InternalLocationData} array containing the data for all the
 *   states of Australia.
 */
function getAustraliaTotalData(australiaStateData: InternalLocationData[]): InternalLocationData {
  const australiaTotalValues = sumMultipleLocationValues(australiaStateData);

  // Latitude and longitude are from https://www.latlong.net/.
  return {
    location: "Australia",
    countryOrRegion: "Australia",
    values: australiaTotalValues,
    latitude: "-25.274399",
    longitude: "133.775131",
  };
}

/**
 * Calculates the data for Canada.
 *
 * *The values for Canada are represented separately for each state in the JHU CSSE data. This
 * function calculates the country totals by summing the data for all the provinces in Canada.*
 *
 * *Also, there is no recoveries data for any of the provinces of Canada in the JHU CSSE data, but
 * there is recoveries data for Canada as a whole. This function incorporates this recoveries data
 * into the returned {@link InternalLocationData} object.
 *
 * @param globalParsedRecoveredDataCSV The {@link ParsedCSV} object containing the global
 *   recoveries time series data.
 * @param canadaProvinceData {@link InternalLocationData} array containing the data for all the
 *   provinces of Canada.
 */
function getCanadaTotalData(
  globalParsedRecoveredDataCSV: ParsedCSV,
  canadaProvinceData: InternalLocationData[]
): InternalLocationData {
  const canadaTotalValues = sumMultipleLocationValues(canadaProvinceData);
  const parsedCanadaRecoveredValues = globalParsedRecoveredDataCSV["Canada"];
  const dateKeys = getDateKeys(globalParsedRecoveredDataCSV);

  // The JHU data doesn't include the recovered data for the provinces of Canada,
  // but includes the recovered data for the whole country.
  dateKeys.forEach((date, index) => {
    canadaTotalValues[index].recovered = parsedCanadaRecoveredValues[date] as number;
  });

  // Latitude and longitude are from the JHU CSSE global recoveries CSV file.
  return {
    location: "Canada",
    countryOrRegion: "Canada",
    values: canadaTotalValues,
    latitude: "56.1304",
    longitude: "-106.3468",
  };
}

/**
 * Calculates the data for China.
 *
 * *The values for China are represented separately for each province in the JHU CSSE data. This
 * function calculates the country totals by summing the data for all the provinces in China.*
 *
 * @param chinaProvinceData {@link InternalLocationData} array containing the data for all the
 *   provinces of China.
 */
function getChinaTotalData(chinaProvinceData: InternalLocationData[]): InternalLocationData {
  const chinaTotalValues = sumMultipleLocationValues(chinaProvinceData);

  // Latitude and longitude are from https://www.latlong.net/.
  return {
    location: "China",
    countryOrRegion: "China",
    values: chinaTotalValues,
    latitude: "35.861660",
    longitude: "104.195396",
  };
}

/**
 * Calculates the data for all US states.
 *
 * *The values in the US data files only include data at the county level. This function calculates
 * state totals by summing the data for all counties of a given state.*
 *
 * @param usCountyData {@link InternalLocationData} array containing the data for all of the
 *   counties in the USA.
 * @returns An array of {@link InternalLocationData} with each element containing the data for a US
 *   state.
 */
function getUSStateTotalsData(usCountyData: InternalLocationData[]): InternalLocationData[] {
  const data: InternalLocationData[] = [];

  for (const state of US_STATES) {
    const { name, latitude, longitude } = state;
    const stateCountiesData = usCountyData.filter(
      (locationData) => locationData.provinceOrState === name
    );

    const stateTotalValues = sumMultipleLocationValues(stateCountiesData);

    const location = getFullLocationName("US", name);
    data.push({
      location,
      countryOrRegion: "US",
      provinceOrState: name,
      values: stateTotalValues,
      latitude,
      longitude,
    });
  }

  return data;
}

/**
 * Extracts values (confirmed cases, deaths and recoveries) from the given CSV rows.
 *
 * @param dateKeys All keys of the given {@link ParsedCSVRow} objects that contain a value for a
 *   certain day.
 * @param confirmedData A {@link ParsedCSVRow} object containing the confirmed cases data for a
 *   location.
 * @param deathsData A {@link ParsedCSVRow} object containing the deaths data for a certain
 *   location.
 * @param recoveredData A {@link ParsedCSVRow} object containing the recoveries data for a
 *   location.
 */
function getValuesFromParsedRows(
  dateKeys: string[],
  confirmedData: ParsedCSVRow,
  deathsData?: ParsedCSVRow,
  recoveredData?: ParsedCSVRow
): InternalLocationDataValues {
  return dateKeys.map((date) => {
    const confirmed = confirmedData[date] as number;

    let deaths = null;
    if (deathsData != null) {
      deaths = deathsData[date] as number;
    }

    let recovered = null;
    if (recoveredData != null) {
      recovered = recoveredData[date] as number;
    }

    return {
      date,
      confirmed,
      deaths,
      recovered,
    };
  });
}

/**
 * Converts parsed CSV objects into an easier to consume format.
 *
 * @param parsedConfirmedData
 * @param parsedDeathsData
 * @param parsedRecoveredData
 */
function formatParsedData(
  parsedConfirmedData: ParsedCSV,
  parsedDeathsData: ParsedCSV,
  parsedRecoveredData?: ParsedCSV
): InternalLocationData[] {
  const dateKeys = getDateKeys(parsedConfirmedData);

  const data: InternalLocationData[] = [];
  for (const location in parsedConfirmedData) {
    if (!parsedConfirmedData.hasOwnProperty(location)) {
      continue;
    }

    const confirmedData = parsedConfirmedData[location];
    const {
      countryOrRegion,
      provinceOrState,
      county,
      latitude,
      longitude,
    } = getLocationInfoFromRow(confirmedData);

    // Remove Canada (Recovered) and Canada (Diamond Princess)
    // from the parsed data, they seem like mistakenly included values.
    if (
      countryOrRegion === "Canada" &&
      (provinceOrState === "Recovered" || provinceOrState === "Diamond Princess")
    ) {
      continue;
    }

    const deathsData = parsedDeathsData?.[location];
    const recoveredData = parsedRecoveredData?.[location];

    const values = getValuesFromParsedRows(dateKeys, confirmedData, deathsData, recoveredData);

    const locationData = {
      location,
      countryOrRegion,
      provinceOrState,
      county,
      latitude,
      longitude,
      values,
    };

    data.push(locationData);
  }

  return data;
}

/**
 * Converts parsed CSV objects that contain global COVID-19 time series into an easier to consume
 * format.
 *
 * @param parsedGlobalConfirmedData
 * @param parsedGlobalDeathsData
 * @param parsedGlobalRecoveredData
 */
export function formatGlobalParsedData(
  parsedGlobalConfirmedData: ParsedCSV,
  parsedGlobalDeathsData: ParsedCSV,
  parsedGlobalRecoveredData: ParsedCSV
): InternalLocationData[] {
  const data = formatParsedData(
    parsedGlobalConfirmedData,
    parsedGlobalDeathsData,
    parsedGlobalRecoveredData
  );

  const ausCanChnData = data.filter(
    (locationData) =>
      locationData.countryOrRegion === "Australia" ||
      locationData.countryOrRegion === "Canada" ||
      locationData.countryOrRegion === "China"
  );
  const australiaStateData = ausCanChnData.filter(
    (locationData) => locationData.countryOrRegion === "Australia"
  );
  const canadaProvinceData = ausCanChnData.filter(
    (locationData) => locationData.countryOrRegion === "Canada"
  );
  const chinaProvinceData = ausCanChnData.filter(
    (locationData) => locationData.countryOrRegion === "China"
  );

  const australiaTotalData = getAustraliaTotalData(australiaStateData);
  const canadaTotalData = getCanadaTotalData(parsedGlobalRecoveredData, canadaProvinceData);
  const chinaTotalData = getChinaTotalData(chinaProvinceData);

  data.push(australiaTotalData);
  data.push(canadaTotalData);
  data.push(chinaTotalData);

  return data;
}

/**
 * Converts parsed CSV objects that contain US COVID-19 time series into an easier to consume
 * format.
 *
 * @param parsedUSConfirmedData
 * @param parsedUsDeathsData
 */
export function formatUSParsedData(
  parsedUSConfirmedData: ParsedCSV,
  parsedUsDeathsData: ParsedCSV
): InternalLocationData[] {
  const data = formatParsedData(parsedUSConfirmedData, parsedUsDeathsData);
  const usStateTotalsData = getUSStateTotalsData(data);

  return [...data, ...usStateTotalsData];
}
