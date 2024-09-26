import { Units } from '../enums/Units.enum';
import { IIdentification, IMeasurements, IPosition } from './Data.interface';

export type IBox = IIdentification & IMeasurements & { weight?: number };
// NEWS
export type IContainer = IIdentification & IMeasurements & IPosition;

export interface IProjectInput extends IIdentification {
  units: Units;
  containers: IContainer[];
  boxes: IBox[];
}
