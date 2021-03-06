import { promises as fs } from "fs";
import { DataGetter, DataGetterError } from "./DataGetter";

/**
 * A data getter that loads the time series data from CSV files.
 *
 * *Returns `undefined` for the "source last updated at" date, as there is no way to determine this
 * without connecting to the GitHub repo.
 *
 * For more information about its methods see {@link DataGetter}.
 */
export class FileGetter implements DataGetter {
  constructor(
    private globalConfirmedCSVPath: string,
    private globalDeathsCSVPath: string,
    private globalRecoveredCSVPath: string,
    private usConfirmedCSVPath: string,
    private usDeathsCSVPath: string
  ) {}

  private static async getFileAsString(path: string): Promise<string> {
    try {
      return (await fs.readFile(path)).toString();
    } catch (e) {
      throw new DataGetterError(e.message);
    }
  }

  async getGlobalConfirmedData(): Promise<string> {
    return await FileGetter.getFileAsString(this.globalConfirmedCSVPath);
  }

  async getGlobalDeathsData(): Promise<string> {
    return await FileGetter.getFileAsString(this.globalDeathsCSVPath);
  }

  async getGlobalRecoveredData(): Promise<string> {
    return await FileGetter.getFileAsString(this.globalRecoveredCSVPath);
  }

  async getUSConfirmedData(): Promise<string> {
    return await FileGetter.getFileAsString(this.usConfirmedCSVPath);
  }

  async getUSDeathsData(): Promise<string> {
    return await FileGetter.getFileAsString(this.usDeathsCSVPath);
  }

  async getSourceLastUpdatedAt(): Promise<Date | undefined> {
    return undefined;
  }
}
