/**
 * The super class of data getter specific errors.
 */
export class DataGetterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataGetterError';
    Object.setPrototypeOf(this, DataGetterError.prototype);
  }
}

/**
 * An interface describing a data getter instance that loads the JHU CSSE time series data from CSV
 * files.
 */
export interface DataGetter {
  /**
   * Returns the date that the source was last updated, e.g. the last commit date for the folder
   * containing the JHU CSSE data in its GitHub repository.
   *
   * If there is no way to determine the date of last update, this method might return `undefined`.
   *
   * @throws {@link DataGetterError} Thrown when there is an error loading the data.
   */
  getSourceLastUpdatedAt(): Promise<Date | undefined>;

  /**
   * Returns the global confirmed cases time series data.
   *
   * @throws {@link DataGetterError} Thrown when there is an error loading the data.
   */
  getGlobalConfirmedData(): Promise<string>;

  /**
   * Returns the global deaths time series data.
   *
   * @throws {@link DataGetterError} Thrown when there is an error loading the data.
   */
  getGlobalDeathsData(): Promise<string>;

  /**
   * Returns the global recoveries time series data.
   *
   * @throws {@link DataGetterError} Thrown when there is an error loading the data.
   */
  getGlobalRecoveredData(): Promise<string>;

  /**
   * Returns the US confirmed cases time series data.
   *
   * @throws {@link DataGetterError} Thrown when there is an error loading the data.
   */
  getUSConfirmedData(): Promise<string>;

  /**
   * Returns the US deaths time series data.
   *
   * @throws {@link DataGetterError} Thrown when there is an error loading the data.
   */
  getUSDeathsData(): Promise<string>;
}
