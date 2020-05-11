export function getFullLocationName(
  countryOrRegion: string,
  provinceOrState?: string,
  county?: string
): string {
  let location = countryOrRegion;
  let subLocation = provinceOrState;

  if (subLocation != null && county != null && subLocation.length > 0 && county.length > 0) {
    subLocation = `${county}, ${subLocation}`;
  }

  if (subLocation != null && subLocation.length > 0) {
    location = `${location} (${subLocation})`;
  }

  return location;
}

export function dateKeyToDate(dateStr: string): Date | undefined {
  const dateParts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);

  if (dateParts == null || dateParts.length < 3) {
    return undefined;
  }

  const year = parseInt(`20${dateParts[3]}`);
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[2]);

  return new Date(year, month, day);
}

export function dateToDateKey(date: Date): string {
  const year = date
    .getFullYear()
    .toString()
    .slice(2);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = date
    .getDate()
    .toString()
    .padStart(2, '0');

  return `${month}/${day}/${year}`;
}
