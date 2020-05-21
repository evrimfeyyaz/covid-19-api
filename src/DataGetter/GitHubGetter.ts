import { Fetch } from "../types";
import { DataGetter, DataGetterError } from "./DataGetter";

/**
 * A data getter that fetches the time series data from the JHU CSSE GitHub repository.
 *
 * For more information about its methods see {@link DataGetter}.
 */
export class GitHubGetter implements DataGetter {
  private readonly fetch: Fetch;
  private commitDataUrl =
    "https://api.github.com/repos/CSSEGISandData/COVID-19/commits?path=csse_covid_19_data%2Fcsse_covid_19_time_series&page=1&per_page=1";
  private baseUrl =
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/";
  private globalConfirmedUrl = `${this.baseUrl}time_series_covid19_confirmed_global.csv`;
  private globalDeathsUrl = `${this.baseUrl}time_series_covid19_deaths_global.csv`;
  private globalRecoveredUrl = `${this.baseUrl}time_series_covid19_recovered_global.csv`;
  private usConfirmedUrl = `${this.baseUrl}time_series_covid19_confirmed_US.csv`;
  private usDeathsUrl = `${this.baseUrl}time_series_covid19_deaths_US.csv`;

  constructor(fetchFn?: Fetch) {
    // This is a hack for getting the global object.
    // See: https://stackoverflow.com/a/3277192
    const get = eval;
    const global = get("this");

    if (fetchFn == null && typeof global !== "undefined" && typeof fetch !== "undefined") {
      // We need to bind the fetch function to the global object, e.g. window, for it to work.
      this.fetch = global.fetch.bind(global);
    } else if (fetchFn != null) {
      this.fetch = fetchFn;
    } else {
      throw new Error(
        "`fetch` is not available. Please check the COVID-19 API documentation for more information."
      );
    }
  }

  async getGlobalConfirmedData(): Promise<string> {
    return await this.fetchData(this.globalConfirmedUrl);
  }

  async getGlobalDeathsData(): Promise<string> {
    return await this.fetchData(this.globalDeathsUrl);
  }

  async getGlobalRecoveredData(): Promise<string> {
    return await this.fetchData(this.globalRecoveredUrl);
  }

  async getUSConfirmedData(): Promise<string> {
    return await this.fetchData(this.usConfirmedUrl);
  }

  async getUSDeathsData(): Promise<string> {
    return await this.fetchData(this.usDeathsUrl);
  }

  async getSourceLastUpdatedAt(): Promise<Date | undefined> {
    const response = await this.fetch(this.commitDataUrl);

    if (!response.ok) {
      throw new DataGetterError(
        `There was an error fetching the commit date from the GitHub API. Response status: ${response.status} - ${response.statusText}`
      );
    }

    const json = await response.json();

    return new Date(json[0]["commit"]["author"]["date"]);
  }

  private async fetchData(url: string): Promise<string> {
    const rawResponse = await this.fetch(url);

    if (!rawResponse.ok) {
      throw new DataGetterError(
        `There was an error fetching the data from GitHub. Response status: ${rawResponse.status} - ${rawResponse.statusText}`
      );
    }

    return await rawResponse.text();
  }
}
