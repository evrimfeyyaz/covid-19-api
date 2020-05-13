import { COVID19APIError } from 'errors';

export interface DataGetter {
  getLastUpdatedAt(): Promise<Date>;
  getGlobalConfirmedData(): Promise<string>;
  getGlobalDeathsData(): Promise<string>;
  getGlobalRecoveredData(): Promise<string>;
  getUSConfirmedData(): Promise<string>;
  getUSDeathsData(): Promise<string>;
}

export class DataGetterError extends COVID19APIError {
  constructor(message: string) {
    super(message);
    this.name = 'DataGetterError';
  }
}
