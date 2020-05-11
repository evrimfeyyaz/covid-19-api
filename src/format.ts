import { getDateKeys, getLocationInfoFromRow, ParsedCSV, ParsedCSVRow } from 'parse';
import { InternalLocationData, InternalLocationDataValues } from 'types';
import { US_STATES } from 'us-states';
import { getFullLocationName } from 'utils';

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
    locationData =>
      locationData.location === 'Australia' ||
      locationData.location === 'Canada' ||
      locationData.location === 'China'
  );
  const australiaStateData = ausCanChnData.filter(
    locationData => locationData.location === 'Australia'
  );
  const canadaProvinceData = ausCanChnData.filter(
    locationData => locationData.location === 'Canada'
  );
  const chinaProvinceData = ausCanChnData.filter(locationData => locationData.location === 'China');

  const australiaTotalData = getAustraliaTotalData(australiaStateData);
  const canadaTotalData = getCanadaTotalData(parsedGlobalRecoveredData, canadaProvinceData);
  const chinaTotalData = getChinaTotalData(chinaProvinceData);

  data.push(australiaTotalData);
  data.push(canadaTotalData);
  data.push(chinaTotalData);

  return data;
}

export function formatUSParsedData(
  parsedUSConfirmedData: ParsedCSV,
  parsedUsDeathsData: ParsedCSV
): InternalLocationData[] {
  const data = formatParsedData(parsedUSConfirmedData, parsedUsDeathsData);
  const usStateTotalsData = getUSStateTotalsData(data);

  return [...data, ...usStateTotalsData];
}

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
      countryOrRegion === 'Canada' &&
      (provinceOrState === 'Recovered' || provinceOrState === 'Diamond Princess')
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

function getValuesFromParsedRows(
  dateKeys: string[],
  confirmedData: ParsedCSVRow,
  deathsData?: ParsedCSVRow,
  recoveredData?: ParsedCSVRow
): InternalLocationDataValues {
  return dateKeys.map(date => {
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

function getAustraliaTotalData(australiaStateData: InternalLocationData[]): InternalLocationData {
  const australiaTotalValues = sumMultipleLocationValues(australiaStateData);

  // Latitudes and longitudes are from https://www.latlong.net/.
  return {
    location: 'Australia',
    countryOrRegion: 'Australia',
    values: australiaTotalValues,
    latitude: '-25.274399',
    longitude: '133.775131',
  };
}

function getCanadaTotalData(
  parsedRecoveredData: ParsedCSV,
  canadaProvinceData: InternalLocationData[]
): InternalLocationData {
  const canadaTotalValues = sumMultipleLocationValues(canadaProvinceData);
  const parsedCanadaRecoveredValues = parsedRecoveredData['Canada'];
  const dateKeys = getDateKeys(parsedRecoveredData);

  dateKeys.forEach((date, index) => {
    canadaTotalValues[index].recovered = parsedCanadaRecoveredValues[date] as number;
  });

  // Latitudes and longitudes are from https://www.latlong.net/.
  return {
    location: 'Canada',
    countryOrRegion: 'Canada',
    values: canadaTotalValues,
    latitude: '56.130367',
    longitude: '-106.346771',
  };
}

function getChinaTotalData(chinaProvinceData: InternalLocationData[]): InternalLocationData {
  const chinaTotalValues = sumMultipleLocationValues(chinaProvinceData);

  // Latitudes and longitudes are from https://www.latlong.net/.
  return {
    location: 'China',
    countryOrRegion: 'China',
    values: chinaTotalValues,
    latitude: '35.861660',
    longitude: '104.195396',
  };
}

function getUSStateTotalsData(usCountyData: InternalLocationData[]): InternalLocationData[] {
  const data: InternalLocationData[] = [];

  for (const state of US_STATES) {
    const { name, latitude, longitude } = state;
    const stateCountiesData = usCountyData.filter(
      locationData => locationData.provinceOrState === name
    );
    const stateTotalValues = sumMultipleLocationValues(stateCountiesData);

    const location = getFullLocationName('US', name);
    data.push({
      location,
      countryOrRegion: 'US',
      values: stateTotalValues,
      latitude,
      longitude,
    });
  }

  return data;
}

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

      const totalRecovered = totalValuesOnDate.recovered;
      if (recovered != null) {
        totalDeaths = (totalRecovered ?? 0) + recovered;
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
