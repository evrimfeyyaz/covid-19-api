declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeSameDay(date1: Date, date2: Date): R;
    }
  }
}

expect.extend({
  toBeSameDay(date1: Date, date2: Date) {
    const pass =
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();

    if (pass) {
      return {
        message: (): string =>
          `expected ${date1.toDateString()} and ${date2.toDateString()} not to be the same day.`,
        pass: true,
      };
    } else {
      return {
        message: (): string =>
          `expected ${date1.toDateString()} and ${date2.toDateString()} to be the same day.`,
        pass: false,
      };
    }
  },
});

export {};
