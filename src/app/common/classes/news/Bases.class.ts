import { IMeasurements, IPosition } from '@common/interfaces/Data.interface';

export class Position implements IPosition {
  protected _x!: number;
  public get x() {
    return this._x;
  }

  protected _y!: number;
  public get y() {
    return this._y;
  }

  protected _z!: number;
  public get z() {
    return this._z;
  }

  constructor(coords?: IPosition) {
    this.set(coords ?? { x: 0, y: 0, z: 0 });
  }

  set(coords: IPosition) {
    this._x = coords.x;
    this._y = coords.y;
    this._z = coords.z;
  }
}

export class Measurements implements IMeasurements {
  protected _width!: number;
  public get width() {
    return this._width;
  }

  protected _height!: number;
  public get height() {
    return this._height;
  }

  protected _depth!: number;
  public get depth() {
    return this._depth;
  }

  constructor(means?: IMeasurements) {
    this.set(means ?? { width: 1, height: 1, depth: 1 });
  }

  set(means: IMeasurements) {
    this._width = means.width;
    this._height = means.height;
    this._depth = means.depth;
  }

  getVolumen() {
    return this.width * this.height * this.depth;
  }
}
