describe('COVID19API', () => {
  describe('when initialized', () => {
    describe('getDataByLocation(s)', () => {
      it.todo('returns the data with added calculated information for a given global location');
      it.todo('returns the data with added calculated information for a given US county');
      it.todo('throws an error when the location cannot be found');
    });

    describe('getDataByLocationAndDate', () => {
      it.todo('returns the data with added calculated values for the given location and date');
      it.todo('throws an error when no data exists for the given date');
    });

    describe('locations', () => {
      it.todo('returns a list of all locations');
    });

    describe('lastUpdatedAt', () => {
      it.todo('returns the date that the source data was last updated');
    });

    describe('firstDate', () => {
      it.todo('returns the first date of the time series');
    });

    describe('lastDate', () => {
      it.todo('returns the last date of the time series');
    });

    describe('with lazy loading on', () => {
      it.todo('does not load the US state and county data before it is requested');
      it.todo('loads the US state and county data when it is requested');
      it.todo(
        'includes all the US state and county names in the locations list even before the US data is requested'
      );
    });

    describe('with lazy loading off', () => {
      it.todo('loads the US state and county before it is requested');
    });

    it.todo('does not reload the data when it is not expired');
    it.todo('reloads the data when it is expired');
  });

  describe('when not initialized', () => {
    it.todo('throws an error when one of its getters is called');
  });
});
