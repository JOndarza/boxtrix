import { Injectable } from '@angular/core';
import { BoxTrixContainer } from '@common/classes/news/Container.class';
import { RenderedController } from '@common/classes/news/Rendered.controller';
import { Rotation } from '@common/enums/Rotation.enum';
import { newId } from '@common/functions/id.function';
import { IMeasurements } from '@common/interfaces/Data.interface';
import { IBox, IStage } from '@common/interfaces/Input.interface';
import { BP3D } from 'binpackingjs';

import { IAlgorithmService } from '../_interfaces/algorithm.service.interface';
import { BINPACKINGJS_BESTFIT, BINPACKINGJS_CONTAINER } from './_common';

const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class BINPACKINGJSService implements IAlgorithmService {
  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  sort(stage: IStage) {
    const data = this.getData(stage);
    this.fixSortData(data);
    return this.mapContainer(stage.id, stage, data);
  }

  private getData(stage: IStage) {
    const unfitted: BINPACKINGJS_BESTFIT[] = [];
    const data = this.findBestFit(stage);

    this.getContainerUnffitedItems(stage, data, unfitted);
    data.unffited = unfitted;

    return data;
  }

  private getContainerUnffitedItems(
    stage: IStage,
    fitted: BINPACKINGJS_BESTFIT,
    unffitedColleccion: BINPACKINGJS_BESTFIT[]
  ) {
    if (!stage || fitted.organized.items.length >= stage.items?.length) return;

    const items = stage.items.filter(
      (item) => !fitted.organized.items.find((x) => x.name === item.id)
    );

    const stageFocus = {
      ...stage,
      id: `${stage.id}-${newId()}`,
      items,
    } as IStage;
    const container = this.findBestFit(stageFocus);

    unffitedColleccion?.push(container);

    this.getContainerUnffitedItems(stageFocus, container, unffitedColleccion);
  }

  //#region Fixing
  private fixSortValues(value: number) {
    return value / this._FIX;
  }

  private fixSortData(data: BINPACKINGJS_BESTFIT) {
    this.fixSortMeasurements(data.organized);

    data.organized.items.forEach((i) => {
      this.fixSortMeasurements(i);
      i.position = [
        this.fixSortValues(i.position[0]),
        this.fixSortValues(i.position[1]),
        this.fixSortValues(i.position[2]),
      ];
    });

    data.unffited?.forEach((i) => this.fixSortData(i));
  }

  private fixSortMeasurements(i: IMeasurements) {
    i.width = this.fixSortValues(i.width);
    i.height = this.fixSortValues(i.height);
    i.depth = this.fixSortValues(i.depth);
  }
  //#endregion Fixing

  //#region Maps
  private mapContainer(id: string, stage: IStage, data: BINPACKINGJS_BESTFIT) {
    const container = new BoxTrixContainer(
      id,
      stage?.name || '',
      stage?.detail || '',
      {
        position: { x: 0, y: 0, z: 0 },
        means: {
          width: stage?.width || 1,
          height: stage?.height || 1,
          depth: stage?.depth || 1,
        },
      }
    );

    const items = this.mapItems(stage, data);

    container.setItems(items.fitted);

    container.fixedMeans.set(data);

    container.setGlobalStep(0);
    container.setGlobalSteps(0);

    container.setUnfitted(this.getUnffited(stage, data));

    return container;
  }

  private getUnffited(stage: IStage, data: BINPACKINGJS_BESTFIT) {
    const clone: IStage = Object.create(stage);

    const unfitted = data.unffited?.map((x, index) => {
      clone.name = `${stage.name} - Unfit ${index + 1}`;
      const container = this.mapContainer(clone.id + newId('-'), clone, x);

      const offset = 2;
      const _x = (clone?.width + offset) * (index + 1);
      container.position.set({ x: -_x, y: 0, z: 0 });
      container.fixedMeans.set(x);

      return container;
    });

    return unfitted || [];
  }

  private mapItems(stage: IStage, data: BINPACKINGJS_BESTFIT) {
    const fitted = data.organized.items.map((binItem) => {
      const item =
        stage.items.find((i) => i.id === binItem.name) || ({} as IBox);

      const data = new RenderedController(
        item.id,
        item.name,
        item.detail || '',
        {
          type: 'box',
          position: {
            x: binItem.position[0],
            y: binItem.position[1],
            z: binItem.position[2],
          },
          means: item,
          rotation: binItem.rotationType,
        }
      );

      return data;
    });

    const unffited = stage.items
      .filter((x) => !data.organized.items.find((y) => y.name === x.id))
      .map(
        (x) =>
          new RenderedController(x.id, x.name, x.detail || '', {
            type: 'box',
            position: {
              x: 0,
              y: 0,
              z: 0,
            },
            means: x,
            rotation: Rotation.WHD,
          })
      );

    return { fitted, unffited };
  }

  //#endregion Maps

  //#region Algorithm
  private mainLogic(stage: IStage, items: IBox[]): BINPACKINGJS_CONTAINER {
    let packer = new Packer();

    let bin = new Bin(stage.id, stage.width, stage.height, stage.depth, 0);
    packer.addBin(bin);

    items.forEach((item) =>
      packer.addItem(
        new Item(item.id, item.width, item.height, item.depth, item.weight || 1)
      )
    );

    packer.pack();

    return bin;
  }

  private findBestFit(original: IStage): BINPACKINGJS_BESTFIT {
    let items = original.items;
    let sorted = this.mainLogic(original, items);

    if (sorted.items.length < items.length)
      items = items.filter((x) => sorted.items.find((y) => y.name === x.id));

    let minWidth = false;
    let minHeight = false;
    let minDepth = false;

    const means = {
      width: original.width,
      height: original.height,
      depth: original.depth,
    } as IMeasurements;

    let previous = {} as BINPACKINGJS_CONTAINER;

    while (!minWidth || !minHeight || !minDepth) {
      const stage = {
        id: original.id,
        name: original.name,
        ...means,
      } as IStage;
      sorted = this.mainLogic(stage, items);

      if (sorted.items.length >= items.length) {
        if (!minWidth) --means.width;
        else if (!minHeight) --means.height;
        else if (!minDepth) --means.depth;

        previous = sorted;
      } else {
        if (!minWidth) {
          minWidth = true;
          ++means.width;
        } else if (!minHeight) {
          minHeight = true;
          ++means.height;
        } else if (!minDepth) {
          minDepth = true;
          ++means.depth;
        }
      }
    }

    return { organized: previous, ...means };
  }
}

//#endregion Algorithm
