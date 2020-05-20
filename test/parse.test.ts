import {
  dateKeyToDate,
  dateToDateKey,
  getDateKeys,
  getLocationInfoFromRow,
  parseCSV,
  ParsedCSVRow,
} from "../src/parse";
import { globalConfirmedDataCSV } from "./testData/globalDataCSV";
import { parsedGlobalConfirmedCSV } from "./testData/globalParsedCSV";
import { usConfirmedDataCSV } from "./testData/usDataCSV";
import { parsedUSConfirmedCSV } from "./testData/usParsedCSV";
import { LocationInfo } from "../src";

describe("parse", () => {
  describe("parseCSV", () => {
    it("parses CSVs containing global data", async () => {
      const result = await parseCSV(globalConfirmedDataCSV);
      const locations = Object.keys(result);
      const newSouthWales = result["Australia (New South Wales)"];

      expect(locations).toEqual([
        "Australia (Australian Capital Territory)",
        "Australia (New South Wales)",
        "Canada (Alberta)",
        "Canada (British Columbia)",
        "China (Anhui)",
        "China (Beijing)",
        "Turkey",
      ]);
      expect(newSouthWales["Country/Region"]).toEqual("Australia");
      expect(newSouthWales["Province/State"]).toEqual("New South Wales");
      expect(newSouthWales["Lat"]).toEqual("-33.8688");
      expect(newSouthWales["Long"]).toEqual("151.2093");
      expect(newSouthWales["1/22/20"]).toEqual(0);
      expect(newSouthWales["1/23/20"]).toEqual(4);
    });

    it("parses CSVs containing US data", async () => {
      const result = await parseCSV(usConfirmedDataCSV);
      const locations = Object.keys(result);
      const autauga = result["US (Autauga, Alabama)"];

      expect(locations).toEqual([
        "US (American Samoa)",
        "US (Autauga, Alabama)",
        "US (Baldwin, Alabama)",
        "US (Southeast Utah, Utah)",
        "US (Southwest Utah, Utah)",
      ]);
      expect(autauga["Country/Region"]).toEqual("US");
      expect(autauga["Province/State"]).toEqual("Alabama");
      expect(autauga["County"]).toEqual("Autauga");
      expect(autauga["Lat"]).toEqual("32.53952745");
      expect(autauga["Long"]).toEqual("-86.64408227");
      expect(autauga["1/22/20"]).toEqual(0);
      expect(autauga["1/23/20"]).toEqual(4);
    });

    it("sets the province/state to `undefined` when it is empty", async () => {
      const parsedCSV = await parseCSV(globalConfirmedDataCSV);
      const result = parsedCSV["Turkey"];

      expect(result["Province/State"]).toBeUndefined();
    });

    it("sets the county to `undefined` when it is empty", async () => {
      const parsedCSV = await parseCSV(usConfirmedDataCSV);
      const result = parsedCSV["US (American Samoa)"];

      expect(result["County"]).toBeUndefined();
    });
  });

  describe("getLocationInfoFromRow", () => {
    it("returns location info from parsed CSV rows", () => {
      const location = "US (Autauga, Alabama)";
      const parsedCSVRow: ParsedCSVRow = parsedUSConfirmedCSV[location];

      const result = getLocationInfoFromRow(parsedCSVRow);
      const expected: LocationInfo = {
        location,
        countryOrRegion: "US",
        provinceOrState: "Alabama",
        county: "Autauga",
        latitude: "32.53952745",
        longitude: "-86.64408227",
      };

      expect(result).toEqual(expected);
    });
  });

  describe("getDateKeys", () => {
    it("returns an array of date keys", () => {
      const result = getDateKeys(parsedGlobalConfirmedCSV);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual("1/22/20");
      expect(result[1]).toEqual("1/23/20");
    });
  });

  describe("dateKeyToDate", () => {
    it("returns given date key as a Date object", () => {
      const dateStr = "1/2/20";

      const result = dateKeyToDate(dateStr) as Date;
      const expected = new Date(2020, 0, 2);

      expect(result.getTime()).toEqual(expected.getTime());
    });

    it("returns `undefined` when a non-date key string is given", () => {
      const wrongStr = "wrong";

      const result = dateKeyToDate(wrongStr);

      expect(result).toBeUndefined();
    });
  });

  describe("dateToDateKey", () => {
    it("returns the date key representation of the given Date", () => {
      const date = new Date(2020, 0, 2);

      const result = dateToDateKey(date);
      const expected = "1/2/20";

      expect(result).toEqual(expected);
    });
  });
});
