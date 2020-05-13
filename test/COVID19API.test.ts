describe('COVID19API', () => {
  describe('when initialized', () => {
    describe('getDataByLocation(s)', () => {
      it('returns the data with added calculated information for a given global location');
      it('returns the data with added calculated information for a given US county');
      it('throws an error when the location cannot be found');
    });

    describe('getDataByLocationAndDate', () => {
      it('returns the data with added calculated values for the given location and date');
      it('throws an error when no data exists for the given date');
    });

    describe('locations', () => {
      it('returns a list of all locations');
    });

    describe('lastUpdatedAt', () => {
      it('returns the date that the source data was last updated');
    });

    describe('firstDate', () => {
      it('returns the first date of the time series');
    });

    describe('lastDate', () => {
      it('returns the last date of the time series');
    });

    describe('with lazy loading on', () => {
      it('does not load the US state and county data before it is requested');
      it('loads the US state and county data when it is requested');
      it(
        'includes all the US state and county names in the locations list even before the US data is requested'
      );
    });

    describe('with lazy loading off', () => {
      it('loads the US state and county before it is requested');
    });

    it('does not reload the data when it is not expired');
    it('reloads the data when it is expired');
  });

  describe('when not initialized', () => {
    it('throws an error when one of its getters is called');
  });
});
