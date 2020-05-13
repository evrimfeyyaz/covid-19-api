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

export function pushUnique<T>(arr: T[], el: T): void {
  if (arr.indexOf(el) === -1) {
    arr.push(el);
  }
}
