import {
  DataStore,
  DataStoreInvalidLocationError,
  DataStoreNotInitializedError,
} from "../../src/DataStore/DataStore";
import { InternalLocationData } from "../../src/types";
import { internalLocationDataArray } from "../testData/internalLocationData";

async function addTestDataToStore(store: DataStore): Promise<string[]> {
  await store.putLocationData(internalLocationDataArray);

  return internalLocationDataArray.map((data) => data.location);
}

export async function sharedDataStoreTests<T extends DataStore>(
  dataStoreConstructor: new () => T
): Promise<void> {
  describe("init", () => {
    it("does not reinitialize", async () => {
      const locationData = internalLocationDataArray[0];
      const locationName = locationData.location;
      const store = new dataStoreConstructor();

      await store.init();
      await store.putLocationData([locationData]);
      let result = await store.getLocationData([locationName]);

      expect(result).toHaveLength(1);

      await store.init();
      result = await store.getLocationData([locationName]);

      expect(result).toHaveLength(1);
    });
  });

  describe("when initialized", () => {
    let locations: string[];
    let store: T;

    beforeAll(async () => {
      store = new dataStoreConstructor();
      await store.init();
      locations = await addTestDataToStore(store);
    });

    describe("getLocationData", () => {
      it("returns the data for the given location names", async () => {
        const result = await store.getLocationData(locations);

        expect(result).toHaveLength(internalLocationDataArray.length);
        expect(result).toEqual(expect.arrayContaining(internalLocationDataArray));
      });

      it("throws an error when a given location cannot be found", async () => {
        const unknownLocation = "Unknown Location";

        await expect(store.getLocationData([unknownLocation])).rejects.toThrow(
          DataStoreInvalidLocationError
        );
      });

      it("returns a clone of the original data", async () => {
        const location = locations[0];
        const [locationData] = await store.getLocationData([location]);

        const expectedValue = locationData.values[0].confirmed;
        locationData.values[0].confirmed = 100;

        const expectedCountry = locationData.countryOrRegion;
        locationData.countryOrRegion = "New Country";

        const [result] = await store.getLocationData([location]);

        expect(result.values[0].confirmed).toEqual(expectedValue);
        expect(result.countryOrRegion).toEqual(expectedCountry);
      });
    });

    describe("getSavedAt", () => {
      it("returns the date and time that the last time a location data was saved in the store", async () => {
        const oneMinuteAgo = Date.now() - 1000 * 60;

        const result = (await store.getSavedAt()) as Date;

        // savedAt is set to less than one minute ago.
        expect(result.getTime()).toBeGreaterThan(oneMinuteAgo);
      });

      it("returns a clone of the original data", async () => {
        const savedAt = (await store.getSavedAt()) as Date;

        const expected = savedAt.getTime();
        savedAt.setTime(expected + 1);

        const result = (await store.getSavedAt()) as Date;

        expect(result.getTime()).toEqual(expected);
      });
    });

    describe("setSourceLastUpdatedAt", () => {
      it("sets the date that the source data was last updated at to the given date", async () => {
        const sourceLastUpdatedAt = new Date();

        await store.setSourceLastUpdatedAt(sourceLastUpdatedAt);
        const result = (await store.getSourceLastUpdatedAt()) as Date;

        expect(result.getTime()).toEqual(sourceLastUpdatedAt.getTime());
      });
    });

    describe("getSourceLastUpdatedAt", () => {
      it("returns a clone of the original data", async () => {
        const sourceLastUpdatedAt = new Date();
        const expected = sourceLastUpdatedAt.getTime();

        await store.setSourceLastUpdatedAt(sourceLastUpdatedAt);
        const lastUpdatedAt = (await store.getSourceLastUpdatedAt()) as Date;
        lastUpdatedAt.setTime(expected + 1);

        const result = (await store.getSourceLastUpdatedAt()) as Date;

        expect(result.getTime()).toEqual(expected);
      });
    });

    describe("putLocationData", () => {
      it("overwrites existing data when saving", async () => {
        const existingData: InternalLocationData = {
          ...internalLocationDataArray.filter(({ location }) => location === "Turkey")[0],
          values: [],
        };
        await store.putLocationData([existingData]);

        const [turkeyData] = await store.getLocationData(["Turkey"]);
        const locations = await store.getLocationsList();

        expect(turkeyData.values).toEqual([]);
        expect(locations.filter((location) => location === "Turkey")).toHaveLength(1);
      });
    });

    describe("getStatesData", () => {
      it("returns only the data for all the states of the given country, and not county data", async () => {
        const result = await store.getStatesData("US");
        const expected = internalLocationDataArray.filter(
          (d) => d.county == null && d.countryOrRegion === "US"
        );

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });

      it("returns an empty array when no state for the given country can be found", async () => {
        const result = await store.getStatesData("Unknown");

        expect(result).toHaveLength(0);
      });

      it("returns a clone of the original data", async () => {
        const [stateData] = await store.getStatesData("US");

        const expectedValue = stateData.values[0].confirmed;
        stateData.values[0].confirmed = 100;

        const expectedCounty = stateData.provinceOrState;
        stateData.provinceOrState = "New State";

        const [result] = await store.getStatesData("US");

        expect(result.values[0].confirmed).toEqual(expectedValue);
        expect(result.provinceOrState).toEqual(expectedCounty);
      });
    });

    describe("getCountiesData", () => {
      it("returns only the data for all the counties of the given state and country, and no state data", async () => {
        const result = await store.getCountiesData("US", "Alabama");
        const expected = internalLocationDataArray.filter(
          (d) => d.county != null && d.countryOrRegion === "US" && d.provinceOrState === "Alabama"
        );

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });

      it("returns an empty array when no county for the given country/state combination can be found", async () => {
        const result = await store.getCountiesData("Unknown", "Unknown");

        expect(result).toHaveLength(0);
      });

      it("returns a clone of the original data", async () => {
        const [countyData] = await store.getCountiesData("US", "Alabama");

        const expectedValue = countyData.values[0].confirmed;
        countyData.values[0].confirmed = 100;

        const expectedCounty = countyData.county;
        countyData.county = "New County";

        const [result] = await store.getCountiesData("US", "Alabama");

        expect(result.values[0].confirmed).toEqual(expectedValue);
        expect(result.county).toEqual(expectedCounty);
      });
    });

    describe("getLocationList", () => {
      it("returns the list of all locations", async () => {
        const result = await store.getLocationsList();
        const expected = internalLocationDataArray.map((d) => d.location);

        expect(result).toHaveLength(expected.length);
        expect(result).toEqual(expect.arrayContaining(expected));
      });

      it("returns a clone of the original data", async () => {
        const locations = await store.getLocationsList();
        const expected = locations[0];
        locations[0] = "New Location";

        const [result] = await store.getLocationsList();

        expect(result).toEqual(expected);
      });
    });

    describe("getLocationCount", () => {
      it("returns the number of locations", async () => {
        const result = await store.getLocationCount();
        const expected = internalLocationDataArray.length;

        expect(result).toEqual(expected);
      });
    });

    describe("clearData", () => {
      it("clears all the location data and settings", async () => {
        await store.clearData();

        const sourceLastUpdatedAt = await store.getSourceLastUpdatedAt();
        const savedAt = await store.getSavedAt();
        const locationsList = await store.getLocationsList();
        const locationCount = await store.getLocationCount();

        await expect(store.getLocationData(["Turkey"])).rejects.toThrow(
          DataStoreInvalidLocationError
        );
        expect(sourceLastUpdatedAt).toBeUndefined();
        expect(savedAt).toBeUndefined();
        expect(locationsList).toEqual([]);
        expect(locationCount).toEqual(0);
      });
    });
  });

  describe("when not initialized", () => {
    let store: T;

    beforeAll(async () => {
      store = new dataStoreConstructor();
    });

    describe("putLocationData", () => {
      it("throws not initialized error", async () => {
        await expect(store.putLocationData([])).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("getLocationData", () => {
      it("throws not initialized error", async () => {
        await expect(store.getLocationData([])).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("getStatesData", () => {
      it("throws not initialized error", async () => {
        await expect(store.getStatesData("")).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("getCountiesData", () => {
      it("throws not initialized error", async () => {
        await expect(store.getCountiesData("", "")).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("getLocationsList", () => {
      it("throws not initialized error", async () => {
        await expect(store.getLocationsList()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("getLocationCount", () => {
      it("throws not initialized error", async () => {
        await expect(store.getLocationCount()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("getSourceLastUpdatedAt", () => {
      it("throws not initialized error", async () => {
        await expect(store.getSourceLastUpdatedAt()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("getSavedAt", () => {
      it("throws not initialized error", async () => {
        await expect(store.getSavedAt()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });

    describe("clearData", () => {
      it("throws not initialized error", async () => {
        await expect(store.clearData()).rejects.toThrow(DataStoreNotInitializedError);
      });
    });
  });
}
