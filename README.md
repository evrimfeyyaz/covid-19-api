<div align="center">
  <h1>COVID-19 API</h1>
  <p>A JavaScript library that provides a simple API for the Johns Hopkins University CSSE COVID-19 time series data.</p>

  <p>
    <img src="https://github.com/evrimfeyyaz/covid-19-api/workflows/CI/badge.svg?branch=master">
    <a href="https://snyk.io/test/github/evrimfeyyaz/covid-19-api"><img src="https://snyk.io/test/github/evrimfeyyaz/covid-19-api/badge.svg" /></a>
    <a href="https://codeclimate.com/github/evrimfeyyaz/covid-19-api/maintainability"><img src="https://api.codeclimate.com/v1/badges/3885a32d01e7c71066eb/maintainability" /></a>
    <a href="https://codeclimate.com/github/evrimfeyyaz/covid-19-api/test_coverage"><img src="https://api.codeclimate.com/v1/badges/3885a32d01e7c71066eb/test_coverage" /></a>
    <a href="https://badge.fury.io/js/%40evrimfeyyaz%2Fcovid-19-api"><img src="https://badge.fury.io/js/%40evrimfeyyaz%2Fcovid-19-api.svg" alt="npm version" height="18"></a>
  </p>
</div>

---

<!-- TOC -->

- [What is COVID-19 API](#what-is-covid-19-api)
- [Installation](#installation)
- [Usage](#usage)
  - [Initialization](#initialization)
  - [Getting the values for a location](#getting-the-values-for-a-location)
    - [`getDataByLocation`](#getdatabylocation)
    - [`getDataByLocations`](#getdatabylocations)
    - [`getDataByLocationAndDate`](#getdatabylocationanddate)
    - [`locations`](#locations)
    - [`sourceLastUpdatedAt`](#sourcelastupdatedat)
    - [`firstDate`](#firstdate)
    - [`lastDate`](#lastdate)
    - [`LocationData`](#locationdata)
    - [`ValuesOnDate`](#valuesondate)
  - [Fetching the data from GitHub](#fetching-the-data-from-github)
  - [Loading the data from local files](#loading-the-data-from-local-files)
  - [Storing the data in IndexedDB](#storing-the-data-in-indexeddb)
  - [Eager loading the US county-level data](#eager-loading-the-us-county-level-data)
  - [Loading status updates](#loading-status-updates)
  - [Data validity](#data-validity)
  - [Error handling](#error-handling)
  	- [`COVID19APIError`](#covid19apierror)
	- [`DataStoreError`](#datastoreerror)
	- [`DataGetterError`](#datagettererror)
  - [Calculated data](#calculated-data)
  - [TypeScript](#typescript)
- [API](#api)
- [Upgrading from earlier versions](#upgrading-from-earlier-versions)
  - [Upgrading to v2](#upgrading-to-v2)
- [About the source data](#about-the-source-data)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

<!-- /TOC -->

## What is COVID-19 API?
COVID-19 API is a JavaScript library that provides a simple-to-use API for [the JHU CSSE time series data](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series).

You can query the dataset for the following information for any location on any given day (starting from January 22, 2020):

- Confirmed cases*
- New cases*
- Deaths*
- New deaths
- Case fatality rate
- Recoveries
- New recoveries
- Recovery rate
- Active cases

This library is extracted from the codebase of [COVID-19 in Charts](https://covid19incharts.com) [(repo)](https://github.com/evrimfeyyaz/covid-19-in-charts).

*\* Included in the JHU CSSE dataset. The rest are calculated by this library.*

## Installation
Using yarn:

```
$ yarn add @evrimfeyyaz/covid-19-api
```

Using npm:

```
$ npm install --save @evrimfeyyaz/covid-19-api
```

## Usage
### Initialization
```js
// CommonJS
const { COVID19API } = require("@evrimfeyyaz/covid-19-api");

// ESM
import { COVID19API } from "@evrimfeyyaz/covid-19-api";
```

Before using the API, you first need to call the `init` method, which returns an empty Promise when the initialization is completed.

```js
const api = new COVID19API();

api.init().then(() => console.log("Initialized."));
```

During initialization, the instance gets populated with data.

### Getting the values for a location
There are three getter methods provided for you:

#### `getDataByLocation`

Returns the data for the given location grouped by date.

```js
api.getDataByLocation("Turkey").then((data) => {
  // Print the name of the location.
  console.log(data.location); // -> Turkey

  // Print the number of confirmed cases on Jan 22, 2020.
  console.log(data.values[0].confirmed); // -> 0
});
```

This method returns a Promise that resolves to an object that implements the `LocationData` interface.

See [`LocationData`](#locationdata) for more information.

#### `getDataByLocations`

Same as [`getDataByLocation`](#getdatabylocation), but can be used to request data for multiple countries at the same time.

```js
api.getDataByLocations(["Turkey", "US"]).then((dataArray) => {
  const turkeyData = dataArray[0];
  // Print the name of the location.
  console.log(turkeyData.location); // -> Turkey

  const usData = dataArray[1];
  // Print the number of confirmed cases on Jan 22, 2020.
  console.log(usData.values[0].confirmed); // -> 1
});
```

This method returns a Promise that resolves to an array containing objects that implement the `LocationData` interface.

See [`LocationData`](#locationdata) for more information.

#### `getDataByLocationAndDate`
Returns all available values (confirmed cases, recoveries, etc.) on a certain date for a given location.

```js
const may1 = new Date(2020, 4, 1);
api.getDataByLocationAndDate("Turkey", may1).then((values) => {
  // Print the number of confirmed cases on May 1, 2020.
  console.log(values.confirmed); // -> 122392

  // Print the number of deaths on May 1, 2020.
  console.log(values.deaths); // -> 3258

  // Print the number of recoveries on May 1, 2020.
  console.log(values.recovered); // -> 53808
});
```

This method returns a Promise that resolves to an array containing objects that implement the [`ValuesOnDate`](#valuesondate) interface.

#### `locations`
Returns the list of all locations in the dataset.

```js
const listOfLocations = api.locations;

console.log(listOfLocations);
```

Outputs:

```sh
[
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia (Australian Capital Territory)',
  'Australia (New South Wales)',
  ...
]
```

#### `sourceLastUpdatedAt`
Returns the last date that the source data was updated.

If you are fetching the data from the JHU CSSE GitHub repository, this returns the last commit date that includes the directory containing the dataset.

If you are loading the data from local files, this returns `undefined`.

#### `firstDate`
Returns the first day of the time series data, which is January 22, 2020.

#### `lastDate`
Returns the last day of the time series data, which should be either today or the day before.

#### `LocationData`
[`getDataByLocation`](#getdatabylocation) and [`getDataByLocations`](#getdatabylocations) methods return an object that implements the `LocationData` interface, which has the following keys:

|Key|Type|Example|
|---|----|-------|
|location|`string`|`"US (Autauga, Alabama"`|
|countryOrRegion|`string`|`"US"`|
|provinceOrState|`string`|`null`|`"Alabama"`|
|county|`string`|`null`|`"Autauga"`|
|latitude|`string`|`"32.53952745"`|
|longitude|`string`|`"-86.64408227"`|
|values|`ValuesOnDate[]`|See [`ValuesOnDate`](#valuesondate) below.|

#### `ValuesOnDate`
[`getDataByLocationAndDate`](#getdatabylocationanddate) method returns an object that implements the `ValuesOnDate` interface, which has the following keys:

|Key|Type|Example|
|---|----|-------|
|date|`string`|`"1/1/20"`|
|confirmed|`number`|`10`|
|newConfirmed|`number`|`5`|
|deaths|`number`|`null`|`2`|
|newDeaths|`number`|`null`|`1`
|caseFatalityRate|`number`|`null`|`0.2`|
|recovered|`number`|`null`|`5`|
|newRecovered|`number`|`null`|`2`|
|recoveryRate|`number`|`null`|`0.5`|
|activeCases|`number`|`null`|`3`|

### Fetching the data from GitHub
The JHU CSSE data is located in [a GitHub repository](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series). If you would like to directly fetch the data from this repository (which is the recommended and default option), you can do the following:

```js
const api = new COVID19API({ loadFrom: "github" });

// Or you can omit this option as "github" is the default value:
const api = new COVID19API();
```

#### Important if you are using this library in NodeJS

This library uses the `fetch` function to fetch the data from the aforementioned repository, and the `fetch` function is not implemented in NodeJS.

For this reason, to use the GitHub fetch function in NodeJS, first install a library that implements the `fetch` function, for example [Node Fetch](https://github.com/node-fetch/node-fetch):

```sh
# Using yarn...
$ yarn add node-fetch

# ...or npm.
$ npm install --save node-fetch
```

Then import the `fetch` function:

```js
// CommonJS
const nodeFetch = require("node-fetch");

// ESM
import nodeFetch from "node-fetch";
```

And supply it to the API:

```js
const api = new COVID19API({ fetch: nodeFetch });
```

*If you are using this library on a modern browser, the `fetch` function should already be implemented, and you shouldn't need to supply it yourself.*

### Loading the data from local files
Instead of fetching the data from GitHub, you can load the data from local files.

Download the following CSV files from the JHU CSSE repository:

1. [time_series_covid19_confirmed_global.csv](https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv)
1. [time_series_covid19_deaths_global.csv](https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv)
1. [time_series_covid19_recovered_global.csv](https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv)
1. [time_series_covid19_confirmed_US.csv](https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv)
1. [time_series_covid19_deaths_US.csv](https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv)

Then, put these files in the same folder as your script, and supply the following option to the API:

```js
const api = new COVID19API({ loadFrom: 'files' });
```

### Storing the data in IndexedDB
By default, when the API is initialized, the data is loaded into the memory.

If, instead, you would prefer to load the data into an IndexedDB database, you can do the following:

```js
const api = new COVID19API({ store: "indexeddb" });
```

With this option, the data is loaded into an IndexedDB database named `COVID19APIDB`.

This is useful in a browser environment, as it prevents the library from repeatedly fetching the data from GitHub with every page load, i.e. it provides a way to persist the data between page requests.

**Note:** This feature is not available when you're using the library in NodeJS.

### Eager loading the US county-level data
The county-level confirmed cases and deaths datasets for the US are included in separate files in the JHU CSSE repository, and they are relatively large (~1.2MB and ~1.1MB respectively at the time this is written).

For this reason, these are by default lazy loaded when a US county or state data is requested using one of the getter methods explained above.

If you would like to have them eager loaded, you can use the `lazyLoadUSData` option:

```js
const api = new COVID19API({ lazyLoadUSData: false });
```

**Note:** The data for the US as a whole is included in the global data, so this lazy loading is only for the US counties and states, and not for the country-level data.

**Note:** The US county-level data only includes confirmed cases and deaths, and no recoveries, but country-wide recoveries data is included in the global data.

### Loading status updates
You can subscribe to get notified when the API instance you are using is loading the data or finished loading the data using the `onLoadingStatusChange` option.

```js
function logLoadingStatusChange(isLoading, message) {
  if (isLoading) {
    console.log(message);
  } else {
    console.log("Loaded!");
  }
}

const api = new COVID19API({
  onLoadingStatusChange: logLoadingStatusChange
});
api.init().then(() => console.log("Initialized!"));
```

```sh
# Output:

Loading the global data.
Loaded!
Initialized!
```

### Data validity
To avoid constantly reloading the data, the data is considered valid for a period of time, and no reloading is done. This is especially important when you are fetching the data directly from GitHub.

By default, the data is considered fresh for a period of one hour from the moment it was loaded.

If you would like to change the validity duration, you can use the `dataValidityInMS` option.

```js
const api = new COVID19API({
  dataValidityInMS: 2 * 60 * 60 * 1000 // 2 hours
});
```

### Error handling
This library throws the below errors (among others that subclass them):

#### `COVID19APIError`
This is the super class of all the errors in this library. You can use this class to catch any error that this library may throw.

#### `DataStoreError`
Thrown when there is an error reading the data from or saving the data to the store (memory or IndexedDB).

#### `DataGetterError`
Thrown when there is an error loading the data (from local files or GitHub).

### Calculated data
The JHU CSSE data includes confirmed cases, deaths and recoveries in its global dataset, and confirmed cases and deaths in its US dataset.

This library also calculates a few extra values for ease-of-use:

1. Number of new confirmed cases on any given day (`newConfirmed`).
1. Number of new deaths on any given day (`newDeaths`).
1. Number of new recoveries on any given day (`newRecovered`).
1. Case fatality rate on any given day (`caseFatalityRate`). Calculated as `deaths / confirmedCases`. Only available if the death numbers are available for the location.
1. Recovery rate out of all confirmed cases (`recoveryRate`). Calculated as `recovered / confirmedCases`. Only available if the recovery numbers are available for the location.
1. Number of active cases on any given day (`activeCases`). Calculated as `confirmedCases - (deaths + recovered)`. Only available if the death and recovery numbers are available for the location.

Also, there are a few calculated locations which are not originally included in the source dataset:

1. The country-level data for Australia, Canada and China are calculated by combining the values of their states/provinces.
1. The state-level data for all US states are calculated by combining the values of their counties.

### TypeScript
This library is written in TypeScript, hence contains all the necessary typings.

## API
[View the full API](https://evrim.io/covid-19-api)

Here are the most important parts of the documentation you might need:

- [COVID19API](https://evrim.io/covid-19-api/modules/_covid19api_.html)
- [COVID19APIOptions](https://evrim.io/covid-19-api/interfaces/_covid19api_.covid19apioptions.html)

## Upgrading from earlier versions
### Upgrading to v2
The only breaking change in v2 is that `mortalityRate` in [`ValuesOnDate`](#valuesondate) is changed to `caseFatalityRate`.

## About the source data
The source data is from the ["COVID-19 Data Repository by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University"](https://github.com/CSSEGISandData/COVID-19).

Please send any feedback regarding the data directly to them, as I have no control over the source data.

**This project is not affiliated by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University.**

## Contributing
Contributions are welcome, but before sending pull requests, please open an issue explaining what needs to be changed.

---

### Author
[Evrim Persembe](https://evrim.io): [evrimfeyyaz](https://github.com/evrimfeyyaz)

### License
[ISC](https://github.com/evrimfeyyaz/covid-19-api/blob/master/LICENSE)
