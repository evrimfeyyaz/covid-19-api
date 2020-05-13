export class Covid19APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Covid19DataStoreError';
  }
}

export class InvalidLocationError extends Covid19APIError {
  constructor(location: string) {
    super(`Invalid location: "${location}".`);
    this.name = 'InvalidLocationError';
  }
}

export class NotInitializedError extends Covid19APIError {
  constructor() {
    super('The data store is not populated. Make sure to first call the `init` method.');
    this.name = 'NotInitializedError';
  }
}

export class PersistedDataAnomalyError extends Covid19APIError {
  constructor() {
    super('The persisted data seems to be empty or it has the wrong format.');
    this.name = 'PersistedDataAnomalyError';
  }
}
