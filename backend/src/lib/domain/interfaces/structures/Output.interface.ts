import { Rotation } from '@domain/enums/Rotation.enum';
import { IIdentification, IMeasurements, IPosition } from './Data.interface';
import { IArea, IBox } from './Input.interface';

export interface IOrganizedBox extends IBox {
  fixedMeans: IMeasurements;
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
