/**
 * Returns the full location name based on the arguments. For example, "Turkey", "Canada (British
 * Columbia)", "US (Autauga, Alabama)".
 *
 * @param countryOrRegion
 * @param provinceOrState
 * @param county
 */
import { InternalLocationData } from 'types';

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

/**
 * Pushes an element into an array if the element doesn't already exist in the array.
 *
 * @param arr
 * @param el
 */
export function pushUnique<T>(arr: T[], el: T): void {
  if (arr.indexOf(el) === -1) {
    arr.push(el);
  }
}

export function cloneInternalLocationData(data: InternalLocationData): InternalLocationData {
  const clonedValues = data.values.map(valuesOnDate => ({
    ...valuesOnDate,
  }));

  return {
    ...data,
    values: clonedValues,
  };
}
