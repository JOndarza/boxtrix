import { IMeasurements, IPosition } from '@common/interfaces/Data.interface';

import { RotationType } from './Bases.class';
import { Rendered } from './Rendered.class';

export type RenderType = 'container' | 'box';

export class RenderedController extends Rendered {
  protected _type: RenderType;
  public get type() {
    return this._type;
  }

  protected _localStep!: number;
  public get localStep() {
    return this._localStep;
  }

  protected _globalStep!: number;
  public get globalStep() {
    return this._globalStep;
  }

  get itemCount() {
    return this._items.length;
  }

  get minSteps() {
    return 0;
  }

  get maxSteps() {
    return this.itemCount;
  }

  protected _items: RenderedController[];
  get items() {
    return this._items;
  }

  constructor(
    id: string,
    name: string,
    detail: string,
    meta: {
      type: RenderType;
      position: IPosition;
      means: IMeasurements;
      rotation: RotationType;
    }
  ) {
    super(id, name, detail, meta);
    this._type = meta.type;

    this._items = [];
  }

  setLocalStep(step: number) {
    this._localStep = step;
  }

  setGlobalStep(step: number) {
    this._globalStep = step;
  }

  protected setItems(...items: RenderedController[]) {
    this._items = items;
  }

  protected addItem(item: RenderedController) {
    this._items.push(item);
  }
}
