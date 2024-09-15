import { Units } from '../enums/Units.enum';

export interface IIdentification {
  id: string;
  name: string;
  detail?: string;
}

export interface IMeasurements {
  width: number;
  height: number;
  deep: number;
}

export type IBox = IIdentification & IMeasurements & { stage: IStage[] };
export type IStage = IIdentification & IMeasurements & { items: IBox[] };

export interface IInput {
  units: Units;
  stages: IStage[];
}
