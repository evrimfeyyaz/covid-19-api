import { promises as fs } from 'fs';
import { DataGetterError } from '../../src/DataGetter/DataGetter';
import { FileGetter } from '../../src/DataGetter/FileGetter';

describe('FileGetter', () => {
  describe('given files that exist', () => {
    const testDataPath = 'src/testData/csv/';
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

    describe('getGlobalConfirmedData', () => {
      it('returns the data from the CSV file', async () => {
        const result = await fileGetter.getGlobalConfirmedData();
        const expected = (await fs.readFile(globalConfirmedCSVPath)).toString();

        expect(result).toEqual(expected);
      });
    });

    describe('getGlobalDeathsData', () => {
      it('returns the data from the CSV file', async () => {
        const result = await fileGetter.getGlobalDeathsData();
        const expected = (await fs.readFile(globalDeathsCSVPath)).toString();

        expect(result).toEqual(expected);
      });
    });

    describe('getGlobalRecoveredData', () => {
      it('returns the data from the CSV file', async () => {
        const result = await fileGetter.getGlobalRecoveredData();
        const expected = (await fs.readFile(globalRecoveredCSVPath)).toString();

        expect(result).toEqual(expected);
      });
    });

    describe('getUSConfirmedData', () => {
      it('returns the data from the CSV file', async () => {
        const result = await fileGetter.getUSConfirmedData();
        const expected = (await fs.readFile(usConfirmedCSVPath)).toString();

        expect(result).toEqual(expected);
      });
    });

    describe('getUSDeathsData', () => {
      it('returns the data from the CSV file', async () => {
        const result = await fileGetter.getUSDeathsData();
        const expected = (await fs.readFile(usDeathsCSVPath)).toString();

        expect(result).toEqual(expected);
      });
    });

    describe('getLastUpdatedAt', () => {
      it('returns `undefined`', async () => {
        const result = await fileGetter.getLastUpdatedAt();

        expect(result).toBeUndefined();
      });
    });
  });

  describe('given files that do not exist', () => {
    const fileGetter = new FileGetter('unknown', 'unknown', 'unknown', 'unknown', 'unknown');

    describe('getGlobalConfirmedData', () => {
      it('throws an error', async () => {
        await expect(fileGetter.getGlobalConfirmedData()).rejects.toThrow(DataGetterError);
      });
    });

    describe('getGlobalDeathsData', () => {
      it('throws an error', async () => {
        await expect(fileGetter.getGlobalDeathsData()).rejects.toThrow(DataGetterError);
      });
    });

    describe('getGlobalRecoveredData', () => {
      it('throws an error', async () => {
        await expect(fileGetter.getGlobalRecoveredData()).rejects.toThrow(DataGetterError);
      });
    });

    describe('getUSConfirmedData', () => {
      it('throws an error', async () => {
        await expect(fileGetter.getUSConfirmedData()).rejects.toThrow(DataGetterError);
      });
    });

    describe('getUSDeathsData', () => {
      it('throws an error', async () => {
        await expect(fileGetter.getUSDeathsData()).rejects.toThrow(DataGetterError);
      });
    });
  });
});
