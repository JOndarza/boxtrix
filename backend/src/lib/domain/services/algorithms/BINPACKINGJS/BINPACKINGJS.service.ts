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

const { Item, Bin } = BP3D;

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
    // BP3D v3 scales inputs by 10^5 internally via factoredInteger() in Bin/Item constructors.
    // Positions in bin.items[].position are returned pre-scaled and must be divided by FIX.
    const bin = new Bin(area.id, area.width, area.height, area.depth, 0);

    // Sort heaviest/largest first (gravity: heavier boxes occupy lower Y positions).
    // We bypass Packer.pack() entirely — it re-sorts by volume on every call and
    // ignores weight. Instead we call bin.putItem() directly in our own priority order.
    const sorted = [...items].sort(
      (a, b) => (b.weight ?? getVolume(b)) - (a.weight ?? getVolume(a)),
    );

    for (const item of sorted) {
      const bpItem = new Item(
        item.id,
        item.width,
        item.height,
        item.depth,
        item.weight ?? getVolume(item),
      );

      if (bin.items.length === 0) {
        bin.putItem(bpItem, [0, 0, 0]);
        continue;
      }

      // Try the three pivot axes against every already-placed item (mirrors packToBin logic)
      let placed = false;
      outer: for (let axis = 0; axis < 3; axis++) {
        for (const pivot_item of bin.items) {
          const d = pivot_item.getDimension();
          const pv: [number, number, number] =
            axis === 0
              ? [pivot_item.position[0] + d[0], pivot_item.position[1], pivot_item.position[2]]
              : axis === 1
                ? [pivot_item.position[0], pivot_item.position[1] + d[1], pivot_item.position[2]]
                : [pivot_item.position[0], pivot_item.position[1], pivot_item.position[2] + d[2]];

          if (bin.putItem(bpItem, pv)) {
            placed = true;
            break outer;
          }
        }
      }

      void placed; // unfit items are simply not in bin.items
    }

    return bin;
  }

  private findBestFit(original: IArea, items: IBox[]): IBINPACKINGJSBestFit {
    let sorted = this.mainLogic(original, items);

    if (sorted.items.length < items.length)
      items = items.filter((x) => sorted.items.find((y) => y.name === x.id));

    // Nothing fits — return early to avoid the infinite loop where 0 >= 0 is always true.
    if (!items.length)
      return { organized: sorted, width: original.width, height: original.height, depth: original.depth };

    // Bounding box of the initial packing is the tightest possible lower bound for each
    // dimension — items can never pack tighter than their actual footprint.
    // Using it as lo cuts the binary search range by 60–90% vs. starting from 1.
    const bbox = this.placedBoundingBox(sorted.items);

    // Binary search each dimension in sequence (same ordering as the original linear shrink).
    // Monotonicity holds: the algorithm is deterministic, so if all items fit in container W
    // they also fit in any W' > W — a larger container never breaks a valid packing.
    const minW = this.bisectDim({ ...original },                            items, 'width',  bbox.width,  original.width);
    const minH = this.bisectDim({ ...original, width: minW },               items, 'height', bbox.height, original.height);
    const minD = this.bisectDim({ ...original, width: minW, height: minH }, items, 'depth',  bbox.depth,  original.depth);

    const tight: IArea = { ...original, width: minW, height: minH, depth: minD };
    return { organized: this.mainLogic(tight, items), width: minW, height: minH, depth: minD };
  }

  // Bounding box of BP3D-placed items. Positions and dimensions are pre-unscale (× FIX).
  private placedBoundingBox(items: IBINPACKINGJSContainer['items']): IMeasurements {
    let maxX = 0, maxY = 0, maxZ = 0;
    for (const item of items as any[]) {
      const d = item.getDimension() as number[];
      maxX = Math.max(maxX, item.position[0] + d[0]);
      maxY = Math.max(maxY, item.position[1] + d[1]);
      maxZ = Math.max(maxZ, item.position[2] + d[2]);
    }
    return { width: maxX / FIX, height: maxY / FIX, depth: maxZ / FIX };
  }

  // Binary search for the minimum integer value of `dim` in [lo, hi] such that
  // mainLogic still packs all `items`. Template carries the already-minimized sibling dims.
  private bisectDim(
    template: IArea,
    items: IBox[],
    dim: 'width' | 'height' | 'depth',
    lo: number,
    hi: number,
  ): number {
    let result = Math.ceil(hi);
    let lo_ = Math.max(1, Math.floor(lo));
    let hi_ = Math.ceil(hi);

    while (lo_ <= hi_) {
      const mid = Math.floor((lo_ + hi_) / 2);
      if (this.mainLogic({ ...template, [dim]: mid }, items).items.length >= items.length) {
        result = mid;
        hi_ = mid - 1;
      } else {
        lo_ = mid + 1;
      }
    }
    return result;
  }
  //#endregion Algorithm
}
