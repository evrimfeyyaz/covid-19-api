import COVID19API, { APINotInitializedError } from '../src/COVID19API';
import { FileGetter } from '../src/DataGetter/FileGetter';
import MemoryStore from '../src/DataStore/MemoryStore';
import { LocationData, ValuesOnDate } from '../src/types';
import './customMatchers';

describe('COVID19API', () => {
  const testDataPath = 'test/testData/csv/';
  const globalConfirmedCSVPath = testDataPath + 'globalConfirmed.csv';
  const globalDeathsCSVPath = testDataPath + 'globalDeaths.csv';
  const globalRecoveredCSVPath = testDataPath + 'globalRecovered.csv';
  const usConfirmedCSVPath = testDataPath + 'usConfirmed.csv';
  const usDeathsCSVPath = testDataPath + 'usDeaths.csv';
  const fileGetter = new FileGetter(
    globalConfirmedCSVPath,
    globalDeathsCSVPath,
    globalRecoveredCSVPath,
    usConfirmedCSVPath,
    usDeathsCSVPath
  );
  const lastUpdatedAt = new Date();
  // As the file getter does not look up the last updated date
  // of the GitHub source, and as this information is not included
  // in the global data files, the file getter returns `undefined`
  // as the last updated at date. We mock that method so that we
  // can still test that the API returns the date from the getter.
  jest
    .spyOn(fileGetter, 'getSourceLastUpdatedAt')
    .mockImplementation(() => Promise.resolve(lastUpdatedAt));
  const getGlobalConfirmedDataSpy = jest.spyOn(fileGetter, 'getGlobalConfirmedData');
  const getGlobalDeathsDataSpy = jest.spyOn(fileGetter, 'getGlobalDeathsData');
  const getGlobalRecoveredDataSpy = jest.spyOn(fileGetter, 'getGlobalRecoveredData');
  const getUSConfirmedDataSpy = jest.spyOn(fileGetter, 'getUSConfirmedData');
  const getUSDeathsDataSpy = jest.spyOn(fileGetter, 'getUSDeathsData');

  const memoryStore = new MemoryStore();
  const dataStoreInitSpy = jest.spyOn(memoryStore, 'init');

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when initialized', () => {
    let covid19API: COVID19API;

    beforeAll(async () => {
      covid19API = new COVID19API(fileGetter, memoryStore);
      await covid19API.init();
    });

    describe('init', () => {
      it('does not re-initialize the instance', async () => {
        expect(dataStoreInitSpy).toBeCalledTimes(1);

        await covid19API.init();

        expect(dataStoreInitSpy).toBeCalledTimes(1);
      });
    });

    describe('getDataByLocation(s)', () => {
      it('returns the data with added calculated information for a given global location', async () => {
        const result1 = await covid19API.getDataByLocation('Turkey');
        const result2 = await covid19API.getDataByLocations(['Turkey']);
        const expected: LocationData = {
          location: 'Turkey',
          countryOrRegion: 'Turkey',
          latitude: '38.9637',
          longitude: '35.2433',
          county: undefined,
          provinceOrState: undefined,
          values: [
            {
              date: '1/22/20',
              confirmed: 0,
              deaths: 0,
              recovered: 0,
              mortalityRate: 0,
              newConfirmed: 0,
              newDeaths: null,
              newRecovered: null,
              recoveryRate: 0,
            },
            {
              date: '1/23/20',
              confirmed: 4,
              deaths: 1,
              recovered: 2,
              mortalityRate: 1 / 4,
              newConfirmed: 4,
              newDeaths: 1,
              newRecovered: 2,
              recoveryRate: 2 / 4,
            },
          ],
        };

        expect(result1).toEqual(expected);
        expect(result2).toEqual([expected]);
      });

      it('returns the data with added calculated information for a given US county', async () => {
        const result1 = await covid19API.getDataByLocation('US (Autauga, Alabama)');
        const result2 = await covid19API.getDataByLocations(['US (Autauga, Alabama)']);
        const expected: LocationData = {
          location: 'US (Autauga, Alabama)',
          countryOrRegion: 'US',
          provinceOrState: 'Alabama',
          county: 'Autauga',
          latitude: '32.53952745',
          longitude: '-86.64408227',
          values: [
            {
              date: '1/22/20',
              confirmed: 0,
              deaths: 0,
              recovered: null,
              newRecovered: null,
              recoveryRate: 0,
              newDeaths: null,
              newConfirmed: 0,
              mortalityRate: 0,
            },
            {
              date: '1/23/20',
              confirmed: 4,
              deaths: 1,
              recovered: null,
              newConfirmed: 4,
              newDeaths: 1,
              recoveryRate: null,
              newRecovered: null,
              mortalityRate: 1 / 4,
            },
          ],
        };

        expect(result1).toEqual(expected);
        expect(result2).toEqual([expected]);
      });
    });

    describe('getDataByLocationAndDate', () => {
      it('returns the data with added calculated values for the given location and date', async () => {
        const secondDate = new Date(2020, 0, 23);

        const result = await covid19API.getDataByLocationAndDate('Turkey', secondDate);
        const expected: ValuesOnDate = {
          date: '1/23/20',
          confirmed: 4,
          deaths: 1,
          recovered: 2,
          mortalityRate: 1 / 4,
          newConfirmed: 4,
          newDeaths: 1,
          newRecovered: 2,
          recoveryRate: 2 / 4,
        };

        expect(result).toEqual(expected);
      });

      it('returns `undefined` when no data can be found for the given date', async () => {
        const dateWithNoData = new Date(2020, 0, 20);

        const result = await covid19API.getDataByLocationAndDate('Turkey', dateWithNoData);

        expect(result).toBeUndefined();
      });
    });

    describe('lastUpdatedAt', () => {
      it('returns the date that the source data was last updated', () => {
        const result = covid19API.lastUpdatedAt;

        expect(result).toEqual(lastUpdatedAt);
      });
    });

    describe('firstDate', () => {
      it('returns the first date of the time series', () => {
        const result = covid19API.firstDate;
        const expected = new Date(2020, 0, 22);

        expect(result).toBeSameDay(result as Date, expected);
      });
    });

    describe('lastDate', () => {
      it('returns the last date of the time series', () => {
        const result = covid19API.lastDate;
        const expected = new Date(2020, 0, 23);

        expect(result).toBeSameDay(result as Date, expected);
      });
    });
  });

  describe('getDataByLocation', () => {
    it('does not reload the data when it is not expired', async () => {
      const covid19API = new COVID19API(fileGetter, memoryStore);
      await covid19API.init();

      getGlobalConfirmedDataSpy.mockClear();
      getGlobalDeathsDataSpy.mockClear();
      getGlobalRecoveredDataSpy.mockClear();

      await covid19API.getDataByLocation('Turkey');

      expect(getGlobalConfirmedDataSpy).not.toBeCalled();
      expect(getGlobalDeathsDataSpy).not.toBeCalled();
      expect(getGlobalRecoveredDataSpy).not.toBeCalled();
    });

    it('reloads the data when it is expired', async () => {
      const covid19API = new COVID19API(fileGetter, memoryStore, {
        dataValidityInMS: 10,
      });
      await covid19API.init();

      await new Promise(r => setTimeout(r, 100));
      getGlobalConfirmedDataSpy.mockClear();
      getGlobalDeathsDataSpy.mockClear();
      getGlobalRecoveredDataSpy.mockClear();

      await covid19API.getDataByLocation('Turkey');

      expect(getGlobalConfirmedDataSpy).toBeCalledTimes(1);
      expect(getGlobalDeathsDataSpy).toBeCalledTimes(1);
      expect(getGlobalRecoveredDataSpy).toBeCalledTimes(1);
    });
  });

  describe('when initialized with', () => {
    let covid19API: COVID19API;

    describe('lazy loading US data on', () => {
      beforeEach(async () => {
        covid19API = new COVID19API(fileGetter, memoryStore, {
          lazyLoadUSData: true,
        });
        await covid19API.init();
      });

      it('does not load the US state and county data before they are requested', async () => {
        await covid19API.getDataByLocation('Turkey');

        expect(getUSConfirmedDataSpy).not.toBeCalled();
        expect(getUSDeathsDataSpy).not.toBeCalled();
      });

      it('loads the US state and county data when they are requested', async () => {
        await covid19API.getDataByLocation('US (Alabama)');

        expect(getUSConfirmedDataSpy).toBeCalledTimes(1);
        expect(getUSDeathsDataSpy).toBeCalledTimes(1);
      });

      describe('locations', () => {
        it('includes all the US state and county names in the locations list even before the US data is requested', () => {
          expect(getUSConfirmedDataSpy).not.toBeCalled();
          expect(getUSDeathsDataSpy).not.toBeCalled();

          const result = covid19API.locations;

          expect(result).toContain('US (Alabama)');
        });
      });
    });

    describe('lazy loading US data off', () => {
      beforeEach(async () => {
        covid19API = new COVID19API(fileGetter, memoryStore, {
          lazyLoadUSData: false,
        });
        await covid19API.init();
      });

      describe('with lazy loading US data off', () => {
        it('loads the US state and county data before they are requested', async () => {
          expect(getUSConfirmedDataSpy).toBeCalledTimes(1);
          expect(getUSDeathsDataSpy).toBeCalledTimes(1);
        });
      });
    });
  });

  describe('when not initialized', () => {
    let covid19API: COVID19API;

    beforeAll(async () => {
      covid19API = new COVID19API(fileGetter, memoryStore);
    });

    describe('locations', () => {
      it('throws an error', async () => {
        expect(() => covid19API.locations).toThrow(APINotInitializedError);
      });
    });

    describe('firstDate', () => {
      it('throws an error', async () => {
        expect(() => covid19API.firstDate).toThrow(APINotInitializedError);
      });
    });

    describe('lastDate', () => {
      it('throws an error', async () => {
        expect(() => covid19API.lastDate).toThrow(APINotInitializedError);
      });
    });

    describe('lastUpdatedAt', () => {
      it('throws an error', async () => {
        expect(() => covid19API.lastUpdatedAt).toThrow(APINotInitializedError);
      });
    });

    describe('getDataByLocation', () => {
      it('throws an error', async () => {
        await expect(covid19API.getDataByLocation('')).rejects.toThrow(APINotInitializedError);
      });
    });

    describe('getDataByLocations', () => {
      it('throws an error', async () => {
        await expect(covid19API.getDataByLocations([''])).rejects.toThrow(APINotInitializedError);
      });
    });

    describe('getDataByLocationAndDate', () => {
      it('throws an error', async () => {
        await expect(covid19API.getDataByLocationAndDate('', new Date())).rejects.toThrow(
          APINotInitializedError
        );
      });
    });
  });
});
