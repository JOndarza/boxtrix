import { getVolume } from '@domain/functions/measurements.function';
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
import { Injectable } from '@nestjs/common';
import { BP3D } from 'binpackingjs';

import {
  IBINPACKINGJSBestFit,
  IBINPACKINGJSContainer,
} from './_common';

const { Item, Bin, Packer } = BP3D;

// BinPackingJS requires integer inputs — all dimensions are scaled by this factor before
// packing and divided back after. Changing this value affects precision.
const FIX = 10 ** 5;

@Injectable()
export class BINPACKINGJSService {
  sort(input: IInput) {
    const areas = this.mapContainers(input);
    return { id: 'algorithm_local', areas };
  }

  //#region Fixing
  private unscale(value: number) {
    return value / FIX;
  }

  private unscaleData(data: IBINPACKINGJSBestFit) {
    this.unscaleMeasurements(data.organized);

    data.organized.items.forEach((i) => {
      this.unscaleMeasurements(i);
      i.position = i.position.map((v) => this.unscale(v));
      i.weight = this.unscale(i.weight);
    });

    data.unfitted?.forEach((i) => this.unscaleData(i));
  }

  private unscaleMeasurements(i: IMeasurements) {
    i.width = this.unscale(i.width);
    i.height = this.unscale(i.height);
    i.depth = this.unscale(i.depth);
  }
  //#endregion Fixing

  //#region Maps
  private mapContainers(input: IInput) {
    const maxStackHeight = input.constraints?.maxStackHeight;

    const areas = input.areas
      .map((x) => {
        const height =
          maxStackHeight != null && maxStackHeight < x.height
            ? maxStackHeight
            : x.height;
        return { ...x, height } as IOrganizedArea;
      })
      .sort((a, b) => getVolume(b) - getVolume(a));

    let unfitted = input.boxes;

    for (const area of areas) {
      const data = this.findBestFit(area, unfitted);
      this.unscaleData(data);

      area.boxes = this.mapItems(data, input.boxes);
      area.fixedMeans = {
        width: data.width,
        height: data.height,
        depth: data.depth,
      };

      unfitted = this.getUnfitted(data, unfitted);
      if (!unfitted.length) break;
    }

    const unfittedArea = this.getContainerUnfitted(unfitted);
    if (unfittedArea) areas.push(unfittedArea);

    return areas;
  }

  private mapItems(data: IBINPACKINGJSBestFit, allItems: IBox[]) {
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

  private getUnfitted(data: IBINPACKINGJSBestFit, items: IBox[]) {
    return items.filter(
      (x) => !data.organized.items.find((y) => y.name === x.id),
    );
  }

  private getContainerUnfitted(unfitted: IBox[]) {
    if (!unfitted.length) return null;

    const totalVolume = unfitted.reduce(
      (acc, curr) => acc + getVolume(curr),
      0,
    );
    const factor = Math.cbrt(totalVolume);

    const means: IMeasurements = {
      width: factor + Math.max(...unfitted.map((x) => x.width)),
      height: factor + Math.max(...unfitted.map((x) => x.height)),
      depth: factor + Math.max(...unfitted.map((x) => x.depth)),
    };

    const area: IOrganizedArea = {
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
    this.unscaleData(data);

    area.width = data.width;
    area.height = data.height;
    area.depth = data.depth;
    area.fixedMeans = { width: data.width, height: data.height, depth: data.depth };
    area.boxes = this.mapItems(data, unfitted);

    return area;
  }
  //#endregion Maps

  //#region Algorithm
  private mainLogic(area: IArea, items: IBox[]): IBINPACKINGJSContainer {
    const packer = new Packer();

    const bin = new Bin(
      area.id,
      area.width * FIX,
      area.height * FIX,
      area.depth * FIX,
      0,
    );
    packer.addBin(bin);

    // Heaviest/largest items first so BP3D places them at lower Y positions (gravity)
    const sorted = [...items].sort(
      (a, b) => (b.weight ?? getVolume(b)) - (a.weight ?? getVolume(a)),
    );

    sorted.forEach((item) =>
      packer.addItem(
        new Item(
          item.id,
          item.width * FIX,
          item.height * FIX,
          item.depth * FIX,
          (item.weight ?? getVolume(item)) * FIX,
        ),
      ),
    );

    packer.pack();

    return bin;
  }

  private findBestFit(original: IArea, items: IBox[]): IBINPACKINGJSBestFit {
    let sorted = this.mainLogic(original, items);

    if (sorted.items.length < items.length)
      items = items.filter((x) => sorted.items.find((y) => y.name === x.id));

    let minWidth = false;
    let minHeight = false;
    let minDepth = false;

    const means: IMeasurements = {
      width: original.width,
      height: original.height,
      depth: original.depth,
    };

    let previous = {} as IBINPACKINGJSContainer;

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
  //#endregion Algorithm
}
