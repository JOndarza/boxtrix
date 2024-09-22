import { Injectable } from '@angular/core';
import { newId } from '@common/functions/id.function';
import { IBox, IInput, IStage } from '@common/interfaces/Input.interface';
import { IBin, IBinItem, IBinStage } from '@common/interfaces/output.interface';
import { BP3D } from 'binpackingjs';
import _ from 'lodash';

const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class BinPackingService {
  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  sort(input: IInput): IBin {
    if (!input) return {} as IBin;

    input.stages.forEach((stage) => {
      stage.id = newId();
      stage.items?.forEach((item) => (item.id = newId()));
    });

    const labelBestFit = 'Best fit in';
    console.time(labelBestFit);
    const data = this.logic(input);
    console.timeEnd(labelBestFit);

    const bin = {
      units: input.units,
      stages: data.map((binStage) => {
        const stage =
          input.stages.find((s) => s.name === binStage.name) || ({} as IStage);
        const { items } = binStage;
        const s = {
          id: stage.id,
          name: stage.name,
          detail: stage.detail,
          width: stage.width,
          height: stage.height,
          depth: stage.depth,
          fixedIMeasurements: {
            width: binStage.width,
            height: binStage.height,
            depth: binStage.depth,
          },
          items: items.map((binItem) => {
            const item =
              stage.items.find((i) => i.id === binItem.name) || ({} as IBox);

            return {
              id: item.id,
              name: item.name,
              detail: item.detail,
              width: binItem.width,
              height: binItem.height,
              depth: binItem.depth,
              weight: binItem.weight,
              position: binItem.position,
              rotationType: binItem.rotationType,
              allowedRotation: binItem.allowedRotation,
            };
          }),
        } as IBinStage;

        return s;
      }),
    };

    this.fixSortData(bin);

    return bin;
  }

  private logic(input: IInput) {
    const sequence: IBinStage[] = input.stages.map((stage) => {
      const items = stage.items;
      const counter = items.length;

      let minWidth = false;
      let minHeight = false;
      let minDepth = false;

      let width = stage.width;
      let height = stage.height;
      let depth = stage.depth;

      let firstIteration = true;

      let previous;
      while (!minWidth || !minHeight || !minDepth) {
        const s = {
          name: stage.name,
          width,
          height,
          depth,
        } as IStage;
        const organized = this.organize(s, items);

        if (organized.items.length >= counter) {
          if (!minWidth) --width;
          else if (!minHeight) --height;
          else if (!minDepth) --depth;

          firstIteration = false;
          previous = organized;
        } else {
          if (firstIteration) return organized;

          if (!minWidth) {
            minWidth = true;
            ++width;
          } else if (!minHeight) {
            minHeight = true;
            ++height;
          } else if (!minDepth) {
            minDepth = true;
          }
        }
      }

      return previous;
    });

    return sequence.flatMap((x) => x);
  }

  private organize(stage: IStage, items: IBox[]) {
    let packer = new Packer();

    let bin = new Bin(stage.name, stage.width, stage.height, stage.depth, 0);
    packer.addBin(bin);

    items.forEach((item) =>
      packer.addItem(
        new Item(item.id, item.width, item.height, item.depth, item.weight)
      )
    );

    packer.pack();

    return bin;
  }

  private fixSortValues(value: number) {
    return value / this._FIX;
  }

  private fixSortData(bin: IBin) {
    bin.stages.forEach((s) => {
      if (s.fixedIMeasurements) {
        s.fixedIMeasurements.depth = this.fixSortValues(
          s.fixedIMeasurements.depth
        );
        s.fixedIMeasurements.height = this.fixSortValues(
          s.fixedIMeasurements.height
        );
        s.fixedIMeasurements.width = this.fixSortValues(
          s.fixedIMeasurements.width
        );
      }

      s.items.forEach((i) => {
        i.depth = this.fixSortValues(i.depth);
        i.height = this.fixSortValues(i.height);
        i.width = this.fixSortValues(i.width);
        i.weight = this.fixSortValues(i.weight || 0);

        i.position = [
          this.fixSortValues(i.position[0]),
          this.fixSortValues(i.position[1]),
          this.fixSortValues(i.position[2]),
        ];
      });

      s.items = _.orderBy(
        s.items,
        (s) => Math.sqrt(s.position[0] ** 2 + s.position[2] ** 2),
        'asc'
      );
    });
  }
}
