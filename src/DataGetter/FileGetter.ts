import { DataGetter, DataGetterError } from 'DataGetter/DataGetter';
import { promises as fs } from 'fs';

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

  async getLastUpdatedAt(): Promise<Date | undefined> {
    return undefined;
  }

  async getUSConfirmedData(): Promise<string> {
    return await FileGetter.getFileAsString(this.usConfirmedCSVPath);
  }

  async getUSDeathsData(): Promise<string> {
    return await FileGetter.getFileAsString(this.usDeathsCSVPath);
  }
}
