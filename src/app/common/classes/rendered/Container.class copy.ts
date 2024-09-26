import { IMeasurements, IPosition } from '@common/interfaces/Data.interface';
import randomColor from 'randomcolor';

import { RenderedController } from './Rendered.controller';

export class Container extends RenderedController {
  constructor(
    id: string,
    name: string,
    detail: string | undefined,
    meta: { position: IPosition; means: IMeasurements }
  ) {
    super(id, name, detail, {
      type: 'container',
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
    items.forEach((item, index) => {
      item.setLocalStep(index);
      item.setColor(randomColor());
    });
    this._items = items;

    this.orderItems();
  }

  /**
   * @param item has to be an IBinItem, step is the index of the item in the container
   */
  override addItem(item: RenderedController) {
    item.setLocalStep(this.itemCount);
    item.setColor(randomColor());
    this._items.push(item);

    this.orderItems();
  }

  setGlobalSteps(previousStep: number) {
    this._items.forEach((item) =>
      item.setGlobalStep(previousStep + item.localStep + 1)
    );
  }

  getItemByStep(step: number) {
    if (step > this.maxSteps && step < this.minSteps) return undefined;
    return this._items.find((item) => item.localStep === step);
  }
}
