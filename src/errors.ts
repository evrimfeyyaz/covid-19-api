export class COVID19APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'COVID19APIError';
  }
}

export class NotInitializedError extends COVID19APIError {
  constructor() {
    super('The data store is not populated. Make sure to first call the `init` method.');
    this.name = 'NotInitializedError';
  }
}

export class PersistedDataAnomalyError extends COVID19APIError {
  constructor() {
    super('The persisted data seems to be empty or it has the wrong format.');
    this.name = 'PersistedDataAnomalyError';
  }
}
