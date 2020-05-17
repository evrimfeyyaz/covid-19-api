/**
 * The super class of all the errors in this library.
 */
export class COVID19APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'COVID19APIError';

    // This is needed because of:
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, COVID19APIError.prototype);
  }
}
