import { IMeasurements, IPosition } from '@common/interfaces/Data.interface';

import { Rotation } from '../../enums/Rotation.enum';
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

  private _selected: boolean = false;
  public get selected() {
    return this._selected;
  }
  public set selected(v: boolean) {
    this._selected = v;
  }

  private _targetable!: boolean;
  public get targetable(): boolean {
    return this._targetable;
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
    detail: string | undefined,
    meta: {
      type: RenderType;
      targable: boolean;
      position: IPosition;
      means: IMeasurements;
      rotation: Rotation;
    }
  ) {
    super(id, name, detail, meta);
    this._type = meta.type;
    this._targetable = meta.targable;

    this._items = [];
  }

  setLocalStep(step: number) {
    this._localStep = step;
  }

  setGlobalStep(step: number) {
    this._globalStep = step;
  }

  setItems(items: RenderedController[]) {
    this._items = items;
  }

  addItem(item: RenderedController) {
    this._items.push(item);
  }
}
