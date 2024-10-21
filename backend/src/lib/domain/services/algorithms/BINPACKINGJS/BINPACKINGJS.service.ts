import { getVolumen } from '@domain/functions/measurements.function';
import { IOrganizeAlgorithmService } from '@domain/interfaces/OrganizeAlgorithm.service.interface';
import { IMeasurements } from '@domain/interfaces/structures/Data.interface';
import {
  IArea,
  IBox,
  IInput,
} from '@domain/interfaces/structures/Input.interface';
import {
  IOrganizedArea,
  IOrganizedBox,
} from '@domain/interfaces/structures/Output.interface';
import { BP3D } from 'binpackingjs';
import { injectable } from 'inversify';
import _ from 'lodash';

import { BINPACKINGJS_BESTFIT, BINPACKINGJS_CONTAINER } from './_common';

const { Item, Bin, Packer } = BP3D;

@injectable()
export class BINPACKINGJSService implements IOrganizeAlgorithmService {
  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  sort(input: IInput) {
    const areas = this.mapContainers(input);
    return { id: 'algorithm_local', areas };
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
      i.weight = this.fixSortValues(i.weight);
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
  private mapContainers(input: IInput) {
    const areas = _.chain(input.areas)
      .map((x) => {
        const maxStackHeight = input.constraints?.maxStackHeight;
        const height =
          !_.isNil(maxStackHeight) && maxStackHeight < x.height
            ? maxStackHeight
            : x.height;
        return { ...x, height } as IOrganizedArea;
      })
      .orderBy((x) => getVolumen(x), 'desc')
      .value();

    let unfitted = input.boxes;
    let previous: IArea | null = null;

    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];

      const data = this.findBestFit(area, unfitted);
      this.fixSortData(data);

      const items = this.mapItems(data, input.boxes);
      area.boxes = items;
      area.fixedMeans = {
        width: data.width,
        height: data.height,
        depth: data.depth,
      };

      unfitted = this.getUnffited(data, unfitted);
      if (!unfitted.length) break;

      previous = area;
    }

    const unfittedArea = this.getContainerUnfitted(unfitted);
    if (unfittedArea) areas.push(unfittedArea);

    return areas;
  }

  private mapItems(data: BINPACKINGJS_BESTFIT, allItems: IBox[]) {
    return data.organized.items.map((binItem) => {
      const item = allItems.find((i) => i.id === binItem.name) || ({} as IBox);

      return {
        id: item.id,
        name: item.name,
        detail: item.detail,
        position: {
          x: binItem.position[0],
          y: binItem.position[1],
          z: binItem.position[2],
        },
        rotation: binItem.rotationType,
      } as IOrganizedBox;
    });
  }

  private getUnffited(data: BINPACKINGJS_BESTFIT, items: IBox[]) {
    return items.filter(
      (x) => !data.organized.items.find((y) => y.name === x.id),
    );
  }

  private getContainerUnfitted(unfitted: IBox[]) {
    if (!unfitted.length) return null;

    const volumen = unfitted.reduce(
      (acc, curr) => acc + curr.width * curr.height * curr.depth,
      0,
    );

    const factor = Math.pow(volumen, 1 / 3);
    const means = {
      width:
        factor +
        _.chain(unfitted)
          .map((x) => x.width)
          .max()
          .value(),
      height:
        factor +
        _.chain(unfitted)
          .map((x) => x.height)
          .max()
          .value(),
      depth:
        factor +
        _.chain(unfitted)
          .map((x) => x.depth)
          .max()
          .value(),
    } as IMeasurements;

    const area = {
      id: 'UNFITTED',
      name: 'UNFITTED',
      width: means.width,
      height: means.height,
      depth: means.depth,
      x: 0,
      y: 0,
      z: 0,
      unplaced: true,
    } as IOrganizedArea;

    const data = this.findBestFit(area, unfitted);
    this.fixSortData(data);

    area.width = data.width;
    area.height = data.height;
    area.depth = data.depth;

    area.fixedMeans = {
      width: data.width,
      height: data.height,
      depth: data.depth,
    };
    area.boxes = this.mapItems(data, unfitted);

    return area;
  }
  //#endregion Maps

  //#region Algorithm
  private mainLogic(area: IArea, items: IBox[]): BINPACKINGJS_CONTAINER {
    const packer = new Packer();

    const bin = new Bin(area.id, area.width, area.height, area.depth, 0);
    packer.addBin(bin);

    items.forEach((item) =>
      packer.addItem(
        new Item(
          item.id,
          item.width,
          item.height,
          item.depth,
          item.weight || 1,
        ),
      ),
    );

    packer.pack();

    return bin;
  }

  private findBestFit(original: IArea, items: IBox[]): BINPACKINGJS_BESTFIT {
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
      const area = {
        id: original.id,
        name: original.name,
        detail: original.detail,
        width: means.width,
        height: means.height,
        depth: means.depth,
      } as IArea;

      sorted = this.mainLogic(area, items);

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
