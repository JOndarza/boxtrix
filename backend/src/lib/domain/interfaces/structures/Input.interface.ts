import { Units } from '@domain/enums/Units.enum';

import { IIdentification, IMeasurements, IPosition } from './Data.interface';

export type IBox = IIdentification & IMeasurements & { weight?: number };
// NEWS
export type IArea = IIdentification & IMeasurements & IPosition;

export interface IInput extends IIdentification {
  areas: IArea[];
  boxes: IBox[];

  constraints: {
    units: Units;
    stackable: boolean;
    maxStackHeight: number;
    mustBeAccessible: boolean;
  };
}
