import { IMeasurements, IPosition } from '../dtos/Data.interface';

export interface IScene {
  minMeans: IMeasurements;
  maxMeans: IMeasurements;

  massCenter: IPosition;

  means: IMeasurements;
  maxHeight: number;
}
