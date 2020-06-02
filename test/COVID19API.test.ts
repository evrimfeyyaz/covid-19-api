import {
  COVID19API,
  COVID19APIAlreadyInitializedError,
  COVID19APINotInitializedError,
  DataStoreInvalidLocationError,
  LocationData,
  ValuesOnDate,
} from "../src";
import { DataGetter } from "../src/DataGetter/DataGetter";
import { GitHubGetter } from "../src/DataGetter/GitHubGetter";
import { DataStore } from "../src/DataStore/DataStore";
import { IndexedDBStore } from "../src/DataStore/IndexedDBStore";
import "./customMatchers";
import {
  globalConfirmedDataCSV,
  globalDeathsDataCSV,
  globalRecoveredDataCSV,
} from "./testData/globalDataCSV";
import { internalLocationDataArray } from "./testData/internalLocationData";
import { usConfirmedDataCSV, usDeathsDataCSV } from "./testData/usDataCSV";

jest.mock("../src/DataGetter/GitHubGetter");
jest.mock("../src/DataStore/IndexedDBStore");

describe("COVID19API", () => {
  const mockSourceLastUpdatedAt = new Date();
  const mockGetGlobalConfirmedData = jest.fn().mockImplementation(() => {
    return Promise.resolve(globalConfirmedDataCSV);
  });
  const mockGetGlobalDeathsData = jest.fn().mockImplementation(() => {
    return Promise.resolve(globalDeathsDataCSV);
  });
  const mockGetGlobalRecoveredData = jest.fn().mockImplementation(() => {
    return Promise.resolve(globalRecoveredDataCSV);
  });
  const mockGetUSConfirmedData = jest.fn().mockImplementation(() => {
    return Promise.resolve(usConfirmedDataCSV);
  });
  const mockGetUSDeathsData = jest.fn().mockImplementation(() => {
    return Promise.resolve(usDeathsDataCSV);
  });
  const mockGetSourceLastUpdatedAt = jest.fn().mockImplementation(() => {
    return Promise.resolve(mockSourceLastUpdatedAt);
  });

  const MockGitHubGetter = (GitHubGetter as unknown) as jest.Mock<DataGetter>;
  const mockGitHubGetterImplementation = {
    getGlobalConfirmedData: mockGetGlobalConfirmedData,
    getGlobalDeathsData: mockGetGlobalDeathsData,
    getGlobalRecoveredData: mockGetGlobalRecoveredData,
    getUSConfirmedData: mockGetUSConfirmedData,
    getUSDeathsData: mockGetUSDeathsData,
    getSourceLastUpdatedAt: mockGetSourceLastUpdatedAt,
  };
  MockGitHubGetter.mockImplementation(() => mockGitHubGetterImplementation);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("when initialized", () => {
    let covid19API: COVID19API;

    beforeAll(async () => {
      covid19API = new COVID19API();
      await covid19API.init();
    });

    describe("init", () => {
      it("throws an error when it is called more than once", async () => {
        await expect(covid19API.init()).rejects.toThrow(COVID19APIAlreadyInitializedError);
      });
    });

    describe("locations", () => {
      it("returns a clone of the locations list", () => {
        const { locations } = covid19API;
        const expected = locations[0];
        locations[0] = "New Location";

        const [result] = covid19API.locations;

        expect(result).toEqual(expected);
      });
    });

    describe("getDataByLocation(s)", () => {
      it("returns the data with added calculated information for a given global location", async () => {
        const result1 = await covid19API.getDataByLocation("Turkey");
        const result2 = await covid19API.getDataByLocations(["Turkey"]);
        const expected: LocationData = {
          location: "Turkey",
          countryOrRegion: "Turkey",
          latitude: "38.9637",
          longitude: "35.2433",
          county: undefined,
          provinceOrState: undefined,
          values: [
            {
              date: "1/22/20",
              confirmed: 0,
              deaths: 0,
              recovered: 0,
              mortalityRate: 0,
              newConfirmed: 0,
              newDeaths: null,
              newRecovered: null,
              recoveryRate: 0,
              activeCases: 0,
            },
            {
              date: "1/23/20",
              confirmed: 4,
              deaths: 1,
              recovered: 2,
              mortalityRate: 1 / 4,
              newConfirmed: 4,
              newDeaths: 1,
              newRecovered: 2,
              recoveryRate: 2 / 4,
              activeCases: 1,
            },
          ],
        };

        expect(result1).toEqual(expected);
        expect(result2).toEqual([expected]);
      });

      it("returns the data with added calculated information for a given US county", async () => {
        const result1 = await covid19API.getDataByLocation("US (Autauga, Alabama)");
        const result2 = await covid19API.getDataByLocations(["US (Autauga, Alabama)"]);
        const expected: LocationData = {
          location: "US (Autauga, Alabama)",
          countryOrRegion: "US",
          provinceOrState: "Alabama",
          county: "Autauga",
          latitude: "32.53952745",
          longitude: "-86.64408227",
          values: [
            {
              date: "1/22/20",
              confirmed: 0,
              deaths: 0,
              recovered: null,
              newRecovered: null,
              recoveryRate: 0,
              newDeaths: null,
              newConfirmed: 0,
              mortalityRate: 0,
              activeCases: null,
            },
            {
              date: "1/23/20",
              confirmed: 4,
              deaths: 1,
              recovered: null,
              newConfirmed: 4,
              newDeaths: 1,
              recoveryRate: null,
              newRecovered: null,
              mortalityRate: 1 / 4,
              activeCases: null,
            },
          ],
        };

        expect(result1).toEqual(expected);
        expect(result2).toEqual([expected]);
      });

      it("returns a clone of the stored data", async () => {
        const locationData1 = await covid19API.getDataByLocation("Turkey");
        const [locationData2] = await covid19API.getDataByLocations(["Turkey"]);
        const expected = locationData1.values[0].confirmed;
        locationData1.values[0].confirmed = expected + 1;
        locationData2.values[0].confirmed = expected + 1;

        const reloadedData1 = await covid19API.getDataByLocation("Turkey");
        const result1 = reloadedData1.values[0].confirmed;
        const [reloadedData2] = await covid19API.getDataByLocations(["Turkey"]);
        const result2 = reloadedData2.values[0].confirmed;

        expect(result1).toEqual(expected);
        expect(result2).toEqual(expected);
      });
    });

    describe("getDataByLocationAndDate", () => {
      const secondDay = new Date(2020, 0, 23);

      it("returns the data with added calculated values for the given location and date", async () => {
        const result = await covid19API.getDataByLocationAndDate("Turkey", secondDay);
        const expected: ValuesOnDate = {
          date: "1/23/20",
          confirmed: 4,
          deaths: 1,
          recovered: 2,
          mortalityRate: 1 / 4,
          newConfirmed: 4,
          newDeaths: 1,
          newRecovered: 2,
          recoveryRate: 2 / 4,
          activeCases: 1,
        };

        expect(result).toEqual(expected);
      });

      it("returns `undefined` when no data can be found for the given date", async () => {
        const dateWithNoData = new Date(2020, 0, 20);

        const result = await covid19API.getDataByLocationAndDate("Turkey", dateWithNoData);

        expect(result).toBeUndefined();
      });

      it("returns a clone of the stored data", async () => {
        const dateValues = (await covid19API.getDataByLocationAndDate(
          "Turkey",
          secondDay
        )) as ValuesOnDate;
        const expected = dateValues.confirmed;
        dateValues.confirmed = expected + 1;

        const reloadedDateValues = (await covid19API.getDataByLocationAndDate(
          "Turkey",
          secondDay
        )) as ValuesOnDate;
        const result = reloadedDateValues.confirmed;

        expect(result).toBeDefined();
        expect(result).toEqual(expected);
      });
    });

    describe("sourceLastUpdatedAt", () => {
      it("returns the date that the source data was last updated", () => {
        const result = covid19API.sourceLastUpdatedAt;

        expect(result).toEqual(mockSourceLastUpdatedAt);
      });

      it("returns a clone of the date", async () => {
        const lastUpdatedAt = covid19API.sourceLastUpdatedAt as Date;
        const expected = lastUpdatedAt.getTime();
        lastUpdatedAt.setTime(expected + 1);

        const result = covid19API.sourceLastUpdatedAt as Date;

        expect(result).toBeDefined();
        expect(result.getTime()).toEqual(expected);
      });
    });

    describe("firstDate", () => {
      it("returns the first date of the time series", () => {
        const result = covid19API.firstDate;
        const expected = new Date(2020, 0, 22);

        expect(result).toBeSameDay(result as Date, expected);
      });

      it("returns a clone of the date", async () => {
        const firstDate = covid19API.firstDate;
        const expected = firstDate.getTime();
        firstDate.setTime(expected + 1);

        const result = covid19API.firstDate;

        expect(result.getTime()).toEqual(expected);
      });
    });

    describe("lastDate", () => {
      it("returns the last date of the time series", () => {
        const result = covid19API.lastDate;
        const expected = new Date(2020, 0, 23);

        expect(result).toBeSameDay(result as Date, expected);
      });

      it("returns a clone of the date", async () => {
        const lastDate = covid19API.lastDate;
        const expected = lastDate.getTime();
        lastDate.setTime(expected + 1);

        const result = covid19API.lastDate;

        expect(result.getTime()).toEqual(expected);
      });
    });
  });

  describe("getDataByLocation", () => {
    describe("when the data is not expired", () => {
      let covid19API: COVID19API;

      beforeEach(async () => {
        covid19API = new COVID19API();
        await covid19API.init();

        mockGetGlobalConfirmedData.mockClear();
        mockGetGlobalDeathsData.mockClear();
        mockGetGlobalRecoveredData.mockClear();
      });

      it("it is not reloaded", async () => {
        await covid19API.getDataByLocation("Turkey");

        expect(mockGetGlobalConfirmedData).not.toBeCalled();
        expect(mockGetGlobalDeathsData).not.toBeCalled();
        expect(mockGetGlobalRecoveredData).not.toBeCalled();
      });

      it("and the source last updated info is `undefined`, the data is not reloaded", async () => {
        MockGitHubGetter.mockImplementationOnce(() => ({
          ...mockGitHubGetterImplementation,
          getSourceLastUpdatedAt: (): Promise<Date | undefined> => Promise.resolve(undefined),
        }));

        await covid19API.getDataByLocation("Turkey");

        expect(mockGetGlobalConfirmedData).not.toBeCalled();
        expect(mockGetGlobalDeathsData).not.toBeCalled();
        expect(mockGetGlobalRecoveredData).not.toBeCalled();
      });
    });

    describe("when the stored data is expired", () => {
      let covid19API: COVID19API;

      beforeEach(async () => {
        covid19API = new COVID19API({ dataValidityInMS: 100 });
        await covid19API.init();

        await new Promise((r) => setTimeout(r, 100));
      });

      it("reloads the data when it is expired", async () => {
        mockGetGlobalConfirmedData.mockClear();
        mockGetGlobalDeathsData.mockClear();
        mockGetGlobalRecoveredData.mockClear();

        await covid19API.getDataByLocation("Turkey");

        expect(mockGetGlobalConfirmedData).toBeCalledTimes(1);
        expect(mockGetGlobalDeathsData).toBeCalledTimes(1);
        expect(mockGetGlobalRecoveredData).toBeCalledTimes(1);
      });

      it("does not load the US state and county data before they are requested", async () => {
        mockGetUSConfirmedData.mockClear();
        mockGetUSDeathsData.mockClear();

        await covid19API.getDataByLocation("Turkey");

        expect(mockGetUSConfirmedData).not.toBeCalled();
        expect(mockGetUSDeathsData).not.toBeCalled();
      });
    });
  });

  describe("when initialized with", () => {
    let covid19API: COVID19API;

    describe("lazy loading US data on", () => {
      beforeEach(async () => {
        covid19API = new COVID19API({ lazyLoadUSData: true });
        await covid19API.init();
      });

      it("does not load the US state and county data before they are requested", async () => {
        await covid19API.getDataByLocation("Turkey");

        expect(mockGetUSConfirmedData).not.toBeCalled();
        expect(mockGetUSDeathsData).not.toBeCalled();
      });

      it("loads the US state and county data when they are requested", async () => {
        await covid19API.getDataByLocation("US (Alabama)");

        expect(mockGetUSConfirmedData).toBeCalledTimes(1);
        expect(mockGetUSDeathsData).toBeCalledTimes(1);
      });

      describe("locations", () => {
        it("includes all the US state and county names in the locations list even before the US data is requested", () => {
          expect(mockGetUSConfirmedData).not.toBeCalled();
          expect(mockGetUSDeathsData).not.toBeCalled();

          const result = covid19API.locations;

          expect(result).toContain("US (Alabama)");
        });
      });
    });

    describe("lazy loading US data off", () => {
      beforeEach(async () => {
        covid19API = new COVID19API({ lazyLoadUSData: false });
        await covid19API.init();
      });

      describe("with lazy loading US data off", () => {
        it("loads the US state and county data before they are requested", async () => {
          expect(mockGetUSConfirmedData).toBeCalledTimes(1);
          expect(mockGetUSDeathsData).toBeCalledTimes(1);
        });
      });
    });

    describe("a loading status change callback", () => {
      let covid19API: COVID19API;
      const mockOnLoadingStatusChange = jest.fn();

      beforeEach(async () => {
        covid19API = new COVID19API({
          onLoadingStatusChange: mockOnLoadingStatusChange,
          dataValidityInMS: 0,
        });

        await covid19API.init();
      });

      describe("init", () => {
        it("sends notifications", async () => {
          expect(mockOnLoadingStatusChange).toHaveBeenNthCalledWith(1, true, expect.any(String));
          expect(mockOnLoadingStatusChange).toHaveBeenLastCalledWith(false);
        });

        it("does not send out a loading finished notification until the initialization is done", async () => {
          let firstDate: Date | undefined = undefined;
          let lastDate: Date | undefined = undefined;
          let locations: string[] | undefined = undefined;

          const covid19API2 = new COVID19API({
            onLoadingStatusChange: (isLoading): void => {
              if (!isLoading) {
                firstDate = covid19API2.firstDate;
                lastDate = covid19API2.lastDate;
                locations = covid19API2.locations;
              }
            },
          });
          await covid19API2.init();

          expect(firstDate).toBeDefined();
          expect(lastDate).toBeDefined();
          expect(locations).toBeDefined();
        });
      });

      describe("getDataByLocation", () => {
        it("sends notifications when the global data is loading", async () => {
          await covid19API.getDataByLocation("Turkey");

          expect(mockOnLoadingStatusChange).toHaveBeenCalledWith(
            true,
            expect.stringContaining("global")
          );
          expect(mockOnLoadingStatusChange).toHaveBeenLastCalledWith(false);
        });

        it("sends notifications when the US data is loading", async () => {
          await covid19API.getDataByLocation("US (Autauga, Alabama)");

          expect(mockOnLoadingStatusChange).toHaveBeenCalledWith(
            true,
            expect.stringContaining("US")
          );
          expect(mockOnLoadingStatusChange).toHaveBeenLastCalledWith(false);
        });
      });

      describe("getDataByLocations", () => {
        it("sends notifications when the global data is loading", async () => {
          await covid19API.getDataByLocations(["Turkey"]);

          expect(mockOnLoadingStatusChange).toHaveBeenCalledWith(
            true,
            expect.stringContaining("global")
          );
          expect(mockOnLoadingStatusChange).toHaveBeenLastCalledWith(false);
        });

        it("sends notifications when the US data is loading", async () => {
          await covid19API.getDataByLocations(["US (Autauga, Alabama)"]);

          expect(mockOnLoadingStatusChange).toHaveBeenCalledWith(
            true,
            expect.stringContaining("US")
          );
          expect(mockOnLoadingStatusChange).toHaveBeenLastCalledWith(false);
        });
      });

      describe("getDataByLocationAndDate", () => {
        it("sends notifications when the global data is loading", async () => {
          await covid19API.getDataByLocationAndDate("Turkey", new Date());

          expect(mockOnLoadingStatusChange).toHaveBeenCalledWith(
            true,
            expect.stringContaining("global")
          );
          expect(mockOnLoadingStatusChange).toHaveBeenLastCalledWith(false);
        });

        it("sends notifications when the US data is loading", async () => {
          await covid19API.getDataByLocationAndDate("US (Autauga, Alabama)", new Date());

          expect(mockOnLoadingStatusChange).toHaveBeenCalledWith(
            true,
            expect.stringContaining("US")
          );
          expect(mockOnLoadingStatusChange).toHaveBeenLastCalledWith(false);
        });
      });
    });
  });

  describe("when the store already has fresh data", () => {
    const MockIndexedDBStore = (IndexedDBStore as unknown) as jest.Mock<Partial<DataStore>>;
    const mockIndexedDBStoreImplementation: Partial<DataStore> = {
      init: () => Promise.resolve(),
      getLocationsList: () =>
        Promise.resolve(internalLocationDataArray.map((data) => data.location)),
      getLocationCount: () => Promise.resolve(internalLocationDataArray.length),
      getSourceLastUpdatedAt: () => Promise.resolve(mockSourceLastUpdatedAt),
      getSavedAt: () => Promise.resolve(new Date()),
      getLocationData: (locations: string[]) => {
        const locationData = internalLocationDataArray.filter((data) =>
          locations.includes(data.location)
        );

        if (locationData.length !== locations.length) {
          throw new DataStoreInvalidLocationError("");
        }

        return Promise.resolve(locationData);
      },
      clearData: () => Promise.resolve(),
      putLocationData: () => Promise.resolve(),
      setSourceLastUpdatedAt: () => Promise.resolve(),
    };
    MockIndexedDBStore.mockImplementation(() => mockIndexedDBStoreImplementation);

    const mockOnLoadingStatusChanged = jest.fn();
    let covid19API: COVID19API;
    beforeEach(async () => {
      covid19API = new COVID19API({
        store: "indexeddb",
        onLoadingStatusChange: mockOnLoadingStatusChanged,
      });
      await covid19API.init();
    });

    describe("init", () => {
      it("still sends out a loading finished notification", () => {
        expect(mockOnLoadingStatusChanged).toHaveBeenLastCalledWith(false);
      });
    });

    describe("getDataByLocation", () => {
      it("does not reload the US data if the store already has the US data", async () => {
        await covid19API.getDataByLocation("US (Autauga, Alabama)");

        expect(mockGetUSConfirmedData).not.toBeCalled();
        expect(mockGetUSDeathsData).not.toBeCalled();
      });
    });
  });

  describe("when not initialized", () => {
    let covid19API: COVID19API;

    beforeAll(async () => {
      covid19API = new COVID19API({});
    });

    describe("locations", () => {
      it("throws an error", async () => {
        expect(() => covid19API.locations).toThrow(COVID19APINotInitializedError);
      });
    });

    describe("firstDate", () => {
      it("throws an error", async () => {
        expect(() => covid19API.firstDate).toThrow(COVID19APINotInitializedError);
      });
    });

    describe("lastDate", () => {
      it("throws an error", async () => {
        expect(() => covid19API.lastDate).toThrow(COVID19APINotInitializedError);
      });
    });

    describe("sourceLastUpdatedAt", () => {
      it("throws an error", async () => {
        expect(() => covid19API.sourceLastUpdatedAt).toThrow(COVID19APINotInitializedError);
      });
    });

    describe("getDataByLocation", () => {
      it("throws an error", async () => {
        await expect(covid19API.getDataByLocation("")).rejects.toThrow(
          COVID19APINotInitializedError
        );
      });
    });

    describe("getDataByLocations", () => {
      it("throws an error", async () => {
        await expect(covid19API.getDataByLocations([""])).rejects.toThrow(
          COVID19APINotInitializedError
        );
      });
    });

    describe("getDataByLocationAndDate", () => {
      it("throws an error", async () => {
        await expect(covid19API.getDataByLocationAndDate("", new Date())).rejects.toThrow(
          COVID19APINotInitializedError
        );
      });
    });
  });
});
