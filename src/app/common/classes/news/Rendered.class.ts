import { newId } from '@common/functions/id.function';
import {
  IIdentification,
  IMeasurements,
  IPosition,
} from '@common/interfaces/Data.interface';
import { ColorRepresentation } from 'three';

import { Measurements, Position } from './Bases.class';
import { Rotation } from '../../enums/Rotation.enum';

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

  protected _rotation!: Rotation;
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
    id: string,
    name: string,
    detail: string,
    meta: {
      position: IPosition;
      means: IMeasurements;
      rotation: Rotation;
    }
  ) {
    this._id = id || newId();
    this._name = name;
    this._detail = detail;

    this._position = new Position(meta.position);
    this._means = new Measurements(meta.means);
    this.setRotation(meta.rotation || Rotation.WHD);
    this.setColor('#FFF');
  }

  setColor(color: ColorRepresentation) {
    this._color = color;
  }

  setRotation(rotation: Rotation) {
    this._rotation = rotation;
    this.fixMeans();
  }

  setFixedMeans(means: IMeasurements) {
    this._fixedMeans = means;
  }

  private fixMeans() {
    const means = {
      width: this.means.width,
      height: this.means.height,
      depth: this.means.depth,
    } as IMeasurements;

    switch (this.rotation) {
      case Rotation.HWD:
        means.width = this.means.height;
        means.height = this.means.width;
        break;
      case Rotation.HDW:
        means.width = this.means.height;
        means.height = this.means.depth;
        means.depth = this.means.width;

        break;
      case Rotation.DHW:
        means.width = this.means.depth;
        means.depth = this.means.width;
        break;
      case Rotation.DWH:
        means.width = this.means.depth;
        means.height = this.means.width;
        means.depth = this.means.height;
        break;
      case Rotation.WDH:
        means.height = this.means.depth;
        means.depth = this.means.height;
        break;
    }

    this.setFixedMeans(means);
  }
}
