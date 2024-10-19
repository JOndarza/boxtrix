import { IMeasurements } from '@domain/interfaces/structures/Data.interface';

export function getVolumen(means: IMeasurements) {
  return means.height * means.width * means.depth;
}
