import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { DataGetterError } from "../../src";
import { GitHubGetter } from "../../src/DataGetter/GitHubGetter";

function mock404(): void {
  fetchMock.mockResponseOnce(
    () => new Promise((resolve) => resolve({ status: 404, body: "Not Found" }))
  );
}

describe("GitHubGetter", () => {
  let gitHubGetter: GitHubGetter;
  let mockSourceLastUpdatedAt: Date;

  beforeAll(() => {
    enableFetchMocks();
  });

  beforeEach(() => {
    gitHubGetter = new GitHubGetter();

    fetchMock.resetMocks();
    fetchMock.mockResponse((req) => {
      return new Promise((resolve) => {
        const { url } = req;
        if (url.match(/^https:\/\/raw\.githubusercontent\.com/)) {
          // Return the last part of the file name, such as 'confirmed_global'.
          resolve(url.match(/^.+_(\w+_\w+)\.csv$/)?.[1]);
        } else if (url.match(/^https:\/\/api\.github\.com/)) {
          mockSourceLastUpdatedAt = new Date();
          resolve(
            JSON.stringify([
              {
                commit: {
                  author: {
                    date: mockSourceLastUpdatedAt.toISOString(),
                  },
                },
              },
            ])
          );
        }

        resolve({
          status: 404,
          body: "Not Found",
        });
      });
    });
  });

  describe("getGlobalConfirmedData", () => {
    it("requests global confirmed data from GitHub", async () => {
      const result = await gitHubGetter.getGlobalConfirmedData();
      const expectedFromMock = "confirmed_global";

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });

    it("throws an error when it cannot fetch the data", async () => {
      mock404();

      await expect(gitHubGetter.getGlobalConfirmedData()).rejects.toThrow(DataGetterError);
    });
  });

  describe("getGlobalDeathsData", () => {
    it("requests global deaths data from GitHub", async () => {
      const result = await gitHubGetter.getGlobalDeathsData();
      const expectedFromMock = "deaths_global";

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });

    it("throws an error when it cannot fetch the data", async () => {
      mock404();

      await expect(gitHubGetter.getGlobalDeathsData()).rejects.toThrow(DataGetterError);
    });
  });

  describe("getGlobalRecoveredData", () => {
    it("requests global recovered data from GitHub", async () => {
      const result = await gitHubGetter.getGlobalRecoveredData();
      const expectedFromMock = "recovered_global";

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });

    it("throws an error when it cannot fetch the data", async () => {
      mock404();

      await expect(gitHubGetter.getGlobalRecoveredData()).rejects.toThrow(DataGetterError);
    });
  });

  describe("getUSConfirmedData", () => {
    it("requests US confirmed data from GitHub", async () => {
      const result = await gitHubGetter.getUSConfirmedData();
      const expectedFromMock = "confirmed_US";

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });

    it("throws an error when it cannot fetch the data", async () => {
      mock404();

      await expect(gitHubGetter.getUSConfirmedData()).rejects.toThrow(DataGetterError);
    });
  });

  describe("getUSDeathsData", () => {
    it("requests US deaths data from GitHub", async () => {
      const result = await gitHubGetter.getUSDeathsData();
      const expectedFromMock = "deaths_US";

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });

    it("throws an error when it cannot fetch the data", async () => {
      mock404();

      await expect(gitHubGetter.getUSDeathsData()).rejects.toThrow(DataGetterError);
    });
  });

  describe("getSourceLastUpdatedAt", () => {
    it("requests the last commit date for the JHU CSSE data time series directory", async () => {
      const result = await gitHubGetter.getSourceLastUpdatedAt();

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(mockSourceLastUpdatedAt);
    });

    it("throws an error when it cannot fetch the commit date", async () => {
      mock404();

      await expect(gitHubGetter.getSourceLastUpdatedAt()).rejects.toThrow(DataGetterError);
    });
  });
});
