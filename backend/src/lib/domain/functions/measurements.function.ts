import { IMeasurements } from '@domain/interfaces/structures/Data.interface';

export function getVolume(means: IMeasurements) {
  return means.height * means.width * means.depth;
}
