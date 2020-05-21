import { formatGlobalParsedData, formatUSParsedData } from "../src/format";
import { InternalLocationData } from "../src/types";
import { US_STATES } from "../src/usStates";
import {
  parsedGlobalConfirmedCSV,
  parsedGlobalDeathsCSV,
  parsedGlobalRecoveredCSV,
} from "./testData/globalParsedCSV";
import { parsedUSConfirmedCSV, parsedUSDeathsCSV } from "./testData/usParsedCSV";

describe("format", () => {
  describe("formatGlobalParsedData", () => {
    let data: Readonly<InternalLocationData>[];

    beforeAll(() => {
      data = formatGlobalParsedData(
        parsedGlobalConfirmedCSV,
        parsedGlobalDeathsCSV,
        parsedGlobalRecoveredCSV
      );
    });

    it("includes all locations in the CSVs in the return value", () => {
      const result = data.map((d) => d.location);
      const expected = [
        "Australia (Australian Capital Territory)",
        "Australia (New South Wales)",
        "Canada (Alberta)",
        "Canada (British Columbia)",
        "China (Anhui)",
        "China (Beijing)",
        "Turkey",
        "Australia",
        "Canada",
        "China",
      ];

      expect(result).toEqual(expected);
    });

    it("includes the formatted data for states/provinces in the return value", () => {
      const result = data.find((d) => d.provinceOrState === "Alberta");
      const expected: InternalLocationData = {
        location: "Canada (Alberta)",
        countryOrRegion: "Canada",
        provinceOrState: "Alberta",
        latitude: "53.9333",
        longitude: "-116.5765",
        values: [
          {
            date: "1/22/20",
            confirmed: 0,
            deaths: 0,
            recovered: null,
          },
          {
            date: "1/23/20",
            confirmed: 4,
            deaths: 1,
            recovered: null,
          },
        ],
      };

      expect(result).toEqual(expected);
    });

    it("includes Australia totals in the return value", () => {
      const result = data.find((d) => d.location === "Australia");
      const expected: InternalLocationData = {
        location: "Australia",
        countryOrRegion: "Australia",
        latitude: "-25.274399",
        longitude: "133.775131",
        values: [
          {
            date: "1/22/20",
            confirmed: 0,
            deaths: 0,
            recovered: 0,
          },
          {
            date: "1/23/20",
            confirmed: 8,
            deaths: 2,
            recovered: 4,
          },
        ],
      };

      expect(result).toEqual(expected);
    });

    it("includes Canada totals in the return value", () => {
      const result = data.find((d) => d.location === "Canada");
      const expected: InternalLocationData = {
        location: "Canada",
        countryOrRegion: "Canada",
        latitude: "56.1304",
        longitude: "-106.3468",
        values: [
          {
            date: "1/22/20",
            confirmed: 0,
            deaths: 0,
            recovered: 0,
          },
          {
            date: "1/23/20",
            confirmed: 8,
            deaths: 2,
            recovered: 4,
          },
        ],
      };

      expect(result).toEqual(expected);
    });

    it("includes China totals in the return value", () => {
      const result = data.find((d) => d.location === "China");
      const expected: InternalLocationData = {
        location: "China",
        countryOrRegion: "China",
        latitude: "35.861660",
        longitude: "104.195396",
        values: [
          {
            date: "1/22/20",
            confirmed: 0,
            deaths: 0,
            recovered: 0,
          },
          {
            date: "1/23/20",
            confirmed: 8,
            deaths: 2,
            recovered: 4,
          },
        ],
      };

      expect(result).toEqual(expected);
    });
  });

  describe("formatUSParsedData", () => {
    let data: Readonly<InternalLocationData>[];

    beforeAll(() => {
      data = formatUSParsedData(parsedUSConfirmedCSV, parsedUSDeathsCSV);
    });

    it("includes all locations in the CSVs and all the state names in the return value", () => {
      const result = data.map((d) => d.location);
      const states = US_STATES.map((state) => `US (${state.name})`);
      const expected = [
        "US (American Samoa)",
        "US (Autauga, Alabama)",
        "US (Baldwin, Alabama)",
        "US (Southeast Utah, Utah)",
        "US (Southwest Utah, Utah)",
        ...states,
      ];

      expect(result).toEqual(expected);
    });

    it("includes the formatted data for counties in the return value", () => {
      const result = data.find((d) => d.county === "Autauga");
      const expected: InternalLocationData = {
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
          },
          {
            date: "1/23/20",
            confirmed: 4,
            deaths: 1,
            recovered: null,
          },
        ],
      };

      expect(result).toEqual(expected);
    });

    it("includes the formatted data for unincorporated territories in the return value", () => {
      const result = data.find((d) => d.provinceOrState === "American Samoa");
      const expected: InternalLocationData = {
        location: "US (American Samoa)",
        countryOrRegion: "US",
        provinceOrState: "American Samoa",
        latitude: "-14.271000000000000",
        longitude: "-170.132",
        values: [
          {
            date: "1/22/20",
            confirmed: 0,
            deaths: 0,
            recovered: null,
          },
          {
            date: "1/23/20",
            confirmed: 4,
            deaths: 1,
            recovered: null,
          },
        ],
      };

      expect(result).toEqual(expected);
    });

    it("includes the formatted data for calculated state totals in the return value", () => {
      const result = data.find((d) => d.location === "US (Alabama)");
      const expected: InternalLocationData = {
        location: "US (Alabama)",
        countryOrRegion: "US",
        provinceOrState: "Alabama",
        latitude: "32.318230",
        longitude: "-86.902298",
        values: [
          {
            date: "1/22/20",
            confirmed: 0,
            deaths: 0,
            recovered: null,
          },
          {
            date: "1/23/20",
            confirmed: 8,
            deaths: 2,
            recovered: null,
          },
        ],
      };

      expect(result).toEqual(expected);
    });
  });
});
