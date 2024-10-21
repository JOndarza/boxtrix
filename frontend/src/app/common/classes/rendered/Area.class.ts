import { IMeasurements, IPosition } from '@common/dtos/Data.interface';
import randomColor from 'randomcolor';

import { RenderedController } from './Rendered.controller';
import _ from 'lodash';

export class Area extends RenderedController {
  constructor(
    id: string,
    name: string,
    detail: string | undefined,
    meta: { position: IPosition; means: IMeasurements },
  ) {
    super(id, name, detail, {
      type: 'area',
      ...meta,
      targable: false,
      rotation: 0,
    });
    this._items = [];
  }

  /**
   * @param items has to be an array of IBinItem ordered by their position in the container
   */
  override setItems(items: RenderedController[]) {
    this._items = items;
    this.orderItems();

    items.forEach((item, index) => {
      item.setLocalStep(index);
      item.setColor(randomColor());
    });
  }

  /**
   * @param item has to be an IBinItem, step is the index of the item in the container
   */
  override addItem(item: RenderedController) {
    this._items.push(item);
    this.orderItems();

    item.setLocalStep(this.itemCount - 1);
    item.setColor(randomColor());
  }

  setGlobalSteps(previousStep: number) {
    this._items.forEach((item) =>
      item.setGlobalStep(previousStep + item.localStep + 1),
    );
  }

  getItemByStep(step: number) {
    if (step > this.maxSteps && step < this.minSteps) return undefined;
    return this._items.find((item) => item.localStep === step);
  }

  protected orderItems() {
    const items = this._items.sort(
      (a, b) =>
        this.getDistanceAtGlobalPosition(a) -
        this.getDistanceAtGlobalPosition(b),
    );
    this._items = items;
  }

  private getDistanceAtGlobalPosition(item: RenderedController) {
    return Math.sqrt(
      (item.position.x - this.position.x) ** 2 +
        (item.position.z - this.position.z) ** 2,
    );
  }
}
