import { Units } from '../enums/Units.enum';
import { IIdentification, IMeasurements } from './Data.interface';

export type IBox = IIdentification & IMeasurements & { weight?: number };
export type IStage = IIdentification &
  IMeasurements & { units: Units; items: IBox[] };
