export class DataGetterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataGetterError';
    Object.setPrototypeOf(this, DataGetterError.prototype);
  }
}

export interface DataGetter {
  getLastUpdatedAt(): Promise<Date | undefined>;
  getGlobalConfirmedData(): Promise<string>;
  getGlobalDeathsData(): Promise<string>;
  getGlobalRecoveredData(): Promise<string>;
  getUSConfirmedData(): Promise<string>;
  getUSDeathsData(): Promise<string>;
}
