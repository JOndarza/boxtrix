import { IMeasurements } from './Data.interface';
import { IBox, IInput, IStage } from './Input.interface';

export interface IBinItem extends IBox {
  allowedRotation: number[];
  position: number[];
  rotationType: number;
}

export interface IBinStage extends IStage {
  items: IBinItem[];
  fixedIMeasurements?: IMeasurements;
  outer?: IBinItem[];
}

export interface IBin extends IInput {
  stages: IBinStage[];
}
