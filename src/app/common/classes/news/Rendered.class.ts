import { newId } from '@common/functions/id.function';
import {
  IIdentification,
  IMeasurements,
  IPosition,
} from '@common/interfaces/Data.interface';
import { ColorRepresentation } from 'three';

import { Measurements, Position, RotationType } from './Bases.class';

export class Rendered implements IIdentification {
  protected _id!: string;
  public get id() {
    return this._id;
  }

  protected _name!: string;
  public get name() {
    return this._name;
  }

  protected _detail!: string;
  public get detail() {
    return this._detail;
  }

  protected _position!: Position;
  public get position() {
    return this._position;
  }

  protected _means!: Measurements;
  public get means() {
    return this._means;
  }

  protected _rotation!: RotationType;
  public get rotation() {
    return this._rotation;
  }

  protected _fixedMeans!: IMeasurements;
  public get fixedMeans() {
    return this._fixedMeans;
  }

  protected _color!: ColorRepresentation;
  public get color() {
    return this._color;
  }

  constructor(
    name: string,
    detail: string,
    meta: {
      position: IPosition;
      means: IMeasurements;
      rotation: RotationType;
    }
  ) {
    this.setId();
    this._name = name;
    this._detail = detail;

    this._position = new Position(meta.position);
    this._means = new Measurements(meta.means);
    this.setRotation(meta.rotation || RotationType.RotationType_WHD);
    this.setColor('#FFF');
  }

  setColor(color: ColorRepresentation) {
    this._color = color;
  }

  setRotation(rotation: RotationType) {
    this._rotation = rotation;
    this.fixMeans();
  }

  protected setId(id?: string) {
    this._id = id || newId();
  }

  private fixMeans() {
    const means = {
      width: this.means.width,
      height: this.means.height,
      depth: this.means.depth,
    } as IMeasurements;

    switch (this.rotation) {
      case RotationType.RotationType_HWD:
        means.width = this.means.height;
        means.height = this.means.width;
        break;
      case RotationType.RotationType_HDW:
        means.width = this.means.height;
        means.height = this.means.depth;
        means.depth = this.means.width;

        break;
      case RotationType.RotationType_DHW:
        means.width = this.means.depth;
        means.depth = this.means.width;
        break;
      case RotationType.RotationType_DWH:
        means.width = this.means.depth;
        means.height = this.means.width;
        means.depth = this.means.height;
        break;
      case RotationType.RotationType_WDH:
        means.height = this.means.depth;
        means.depth = this.means.height;
        break;
    }

    this._fixedMeans = means;
  }
}
