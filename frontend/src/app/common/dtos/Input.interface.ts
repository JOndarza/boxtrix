import { Corner } from '../enums/Corner.enum';
import { Units } from '../enums/Units.enum';

import { IIdentification, IMeasurements, IPosition } from './Data.interface';

export type IBox = IIdentification & IMeasurements & { weight?: number };

export interface IExitCorridor extends IPosition, IMeasurements {}

export type IArea = IIdentification &
  IMeasurements &
  IPosition & {
    accessCorner?: Corner;
    exitCorridor?: IExitCorridor;
    maxStackHeight?: number;
  };

export interface IInput extends IIdentification {
  areas: IArea[];
  boxes: IBox[];

  constraints?: {
    units?: Units;
    maxStackHeight?: number;
    minSupportRatio?: number;
  };
}
