import { DataGetter, DataGetterError } from 'DataGetter/DataGetter';

/**
 * Thrown when there is an error fetching the CSV time series files from the GitHub repository.
 */
export class GitHubDataFetchError extends DataGetterError {
  constructor(status: number, statusText: string) {
    super(
      `There was an error fetching the data from GitHub. Response status: ${status} - ${statusText}`
    );
    this.name = 'GitHubDataFetchError';
    Object.setPrototypeOf(this, GitHubDataFetchError.prototype);
  }
}

/**
 * Thrown when there is an error fetching the last commit date of the GitHub repository folder
 * containing the time series data.
 */
export class GitHubCommitFetchError extends DataGetterError {
  constructor(status: number, statusText: string) {
    super(
      `There was an error fetching the commit date from the GitHub API. Response status: ${status} - ${statusText}`
    );
    this.name = 'GitHubCommitFetchError';
    Object.setPrototypeOf(this, GitHubCommitFetchError.prototype);
  }
}

/**
 * A data getter that fetches the time series data from the JHU CSSE GitHub repository.
 *
 * For more information about its methods see {@link DataGetter}.
 */
export class GitHubGetter implements DataGetter {
  private commitDataUrl =
    'https://api.github.com/repos/CSSEGISandData/COVID-19/commits?path=csse_covid_19_data%2Fcsse_covid_19_time_series&page=1&per_page=1';
  private baseUrl =
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/';
  private globalConfirmedUrl = `${this.baseUrl}time_series_covid19_confirmed_global.csv`;
  private globalDeathsUrl = `${this.baseUrl}time_series_covid19_deaths_global.csv`;
  private globalRecoveredUrl = `${this.baseUrl}time_series_covid19_recovered_global.csv`;
  private usConfirmedUrl = `${this.baseUrl}time_series_covid19_confirmed_US.csv`;
  private usDeathsUrl = `${this.baseUrl}time_series_covid19_deaths_US.csv`;

  private static async fetchData(url: string): Promise<string> {
    const rawResponse = await fetch(url);

    if (!rawResponse.ok) {
      throw new GitHubDataFetchError(rawResponse.status, rawResponse.statusText);
    }

    return await rawResponse.text();
  }

  /**
   * @throws {@link GitHubDataFetchError} when there is an error fetching the data.
   */
  async getGlobalConfirmedData(): Promise<string> {
    return await GitHubGetter.fetchData(this.globalConfirmedUrl);
  }

  /**
   * @throws {@link GitHubDataFetchError} when there is an error fetching the data.
   */
  async getGlobalDeathsData(): Promise<string> {
    return await GitHubGetter.fetchData(this.globalDeathsUrl);
  }

  /**
   * @throws {@link GitHubDataFetchError} when there is an error fetching the data.
   */
  async getGlobalRecoveredData(): Promise<string> {
    return await GitHubGetter.fetchData(this.globalRecoveredUrl);
  }

  /**
   * @throws {@link GitHubDataFetchError} when there is an error fetching the data.
   */
  async getUSConfirmedData(): Promise<string> {
    return await GitHubGetter.fetchData(this.usConfirmedUrl);
  }

  /**
   * @throws {@link GitHubDataFetchError} when there is an error fetching the data.
   */
  async getUSDeathsData(): Promise<string> {
    return await GitHubGetter.fetchData(this.usDeathsUrl);
  }

  /**
   * @throws {@link GitHubCommitFetchError} when there is an error fetching the commit date.
   */
  async getSourceLastUpdatedAt(): Promise<Date | undefined> {
    const response = await fetch(this.commitDataUrl);

    if (!response.ok) {
      throw new GitHubCommitFetchError(response.status, response.statusText);
    }

    const json = await response.json();

    return new Date(json[0]['commit']['author']['date']);
  }
}
