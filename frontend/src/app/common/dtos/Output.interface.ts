import { Rotation } from '../enums/Rotation.enum';

import { IIdentification, IMeasurements, IPosition } from './Data.interface';
import { IArea } from './Input.interface';

export interface IOrganizedBox extends IIdentification {
  position: IPosition;
  rotation: Rotation;
}

export interface IOrganizedArea extends IArea {
  unplaced: boolean;
  fixedMeans: IMeasurements;
  boxes: IOrganizedBox[];
}

export interface IOutput extends IIdentification {
  areas: IOrganizedArea[];
}
