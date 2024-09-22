export interface IIdentification {
  id: string;
  name: string;
  detail?: string;
}

export interface IPosition {
  x: number;
  y: number;
  z: number;
}

export interface IMeasurements {
  width: number;
  height: number;
  depth: number;
}
