import { IMeasurements, IPosition } from '@common/interfaces/Data.interface';
import { IBinItem } from '@common/interfaces/output.interface';
import randomColor from 'randomcolor';

import { RenderedController } from './Rendered.controller';

export class BoxTrixContainer extends RenderedController {
  constructor(
    id: string,
    name: string,
    detail: string,
    meta: { position: IPosition; means: IMeasurements }
  ) {
    super(id, name, detail, { type: 'container', ...meta, rotation: 0 });
    this._items = [];
  }

  /**
   * @param items has to be an array of IBinItem ordered by their position in the container
   */
  setData(items: IBinItem[]) {
    const collection = items.map((item, index) => {
      const data = this.getDataItem(item);
      data.setLocalStep(index);
      return data;
    });
    this.setItems(...collection);
  }

  /**
   * @param item has to be an IBinItem, step is the index of the item in the container
   */
  setItem(item: IBinItem) {
    const data = this.getDataItem(item);
    data.setLocalStep(this._items.length);
    data.setColor(randomColor());

    this.addItem(data);
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

  private getDataItem(item: IBinItem) {
    const data = new RenderedController(item.id, item.name, item.detail || '', {
      type: 'box',
      position: {
        x: item.position[0],
        y: item.position[1],
        z: item.position[2],
      },
      means: item,
      rotation: item.rotationType,
    });

    data.setColor(randomColor());

    return data;
  }
}
