import { Rotation } from '../enums/Rotation.enum';

import { IIdentification, IMeasurements, IPosition } from './Data.interface';
import { IArea } from './Input.interface';

export interface IOrganizedBox extends IIdentification {
  position: IPosition;
  rotation: Rotation;
  /** Dimensions after the rotation has been applied (server-computed). */
  rotatedSize?: IMeasurements;
}

export interface IOrganizedArea extends IArea {
  unplaced: boolean;
  fixedMeans: IMeasurements;
  boxes: IOrganizedBox[];
}

export interface IStats {
  availableVolume: number;
  occupiedVolume: number;
  unplacedVolume: number;
  wastedVolume: number;
  efficiencyPct: number;
  placedCount: number;
  unplacedCount: number;
}

export interface IOutput extends IIdentification {
  areas: IOrganizedArea[];
  stats: IStats;
}
