import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { DataGetterError } from '../../src/DataGetter/DataGetter';
import { GitHubGetter } from '../../src/DataGetter/GitHubGetter';

describe('GitHubGetter', () => {
  let gitHubGetter: GitHubGetter;
  let mockLastUpdatedAt: Date;

  beforeAll(() => {
    enableFetchMocks();
  });

  beforeEach(() => {
    gitHubGetter = new GitHubGetter();

    fetchMock.resetMocks();
    fetchMock.mockResponse(req => {
      return new Promise(resolve => {
        const { url } = req;
        if (url.match(/^https:\/\/raw\.githubusercontent\.com/)) {
          // Return the last part of the file name, such as 'confirmed_global'.
          resolve(url.match(/^.+_(\w+_\w+)\.csv$/)?.[1]);
        } else if (url.match(/^https:\/\/api\.github\.com/)) {
          mockLastUpdatedAt = new Date();
          resolve(
            JSON.stringify([
              {
                commit: {
                  author: {
                    date: mockLastUpdatedAt.toISOString(),
                  },
                },
              },
            ])
          );
        }

        resolve({
          status: 404,
          body: 'Not Found',
        });
      });
    });
  });

  describe('getGlobalConfirmedData', () => {
    it('requests global confirmed data from GitHub', async () => {
      const result = await gitHubGetter.getGlobalConfirmedData();
      const expectedFromMock = 'confirmed_global';

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });

    it('throws an error when it cannot connect to the GitHub server', async () => {
      fetchMock.mockResponseOnce(
        () => new Promise(resolve => resolve({ status: 404, body: 'Not Found' }))
      );

      let error: DataGetterError | undefined;
      try {
        await gitHubGetter.getGlobalConfirmedData();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });
  });

  describe('getGlobalDeathsData', () => {
    it('requests global deaths data from GitHub', async () => {
      const result = await gitHubGetter.getGlobalDeathsData();
      const expectedFromMock = 'deaths_global';

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });
  });

  describe('getGlobalRecoveredData', () => {
    it('requests global recovered data from GitHub', async () => {
      const result = await gitHubGetter.getGlobalRecoveredData();
      const expectedFromMock = 'recovered_global';

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });
  });

  describe('getUSConfirmedData', () => {
    it('requests US confirmed data from GitHub', async () => {
      const result = await gitHubGetter.getUSConfirmedData();
      const expectedFromMock = 'confirmed_US';

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });
  });

  describe('getUSDeathsData', () => {
    it('requests US deaths data from GitHub', async () => {
      const result = await gitHubGetter.getUSDeathsData();
      const expectedFromMock = 'deaths_US';

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(expectedFromMock);
    });
  });

  describe('getLastUpdatedAt', () => {
    it('requests the last commit date for the JHU CSSE data time series directory', async () => {
      const result = await gitHubGetter.getLastUpdatedAt();

      expect(fetchMock).toBeCalledTimes(1);
      expect(result).toEqual(mockLastUpdatedAt);
    });

    it('throws an error when it cannot connect to the GitHub server', async () => {
      fetchMock.mockResponseOnce(
        () => new Promise(resolve => resolve({ status: 404, body: 'Not Found' }))
      );

      let error: DataGetterError | undefined;
      try {
        await gitHubGetter.getLastUpdatedAt();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });
  });
});
