import { Units } from '../enums/Units.enum';
import { IIdentification, IMeasurements } from './Data.interface';

export type IBox = IIdentification & IMeasurements & { weight?: number };
export type IStage = IIdentification & IMeasurements & { items: IBox[] };

export interface IInput {
  units: Units;
  stages: IStage[];
}
