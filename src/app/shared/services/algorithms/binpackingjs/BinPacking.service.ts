import { Injectable } from '@angular/core';
import { BoxTrixContainer } from '@common/classes/news/Container.class';
import { RenderedController } from '@common/classes/news/Rendered.controller';
import { IBox, IInput, IStage } from '@common/interfaces/Input.interface';
import { BP3D } from 'binpackingjs';

import { IAlgorithmService } from '../_interfaces/algorithm.service.interface';
import { BINPACKINGJS_BESTFIT, BINPACKINGJS_CONTAINER } from './_common';
import { Rotation } from '@common/enums/Rotation.enum';

const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class BinPackingService implements IAlgorithmService {
  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  sort(input: IInput) {
    const data = this.findBestFit(input);
    this.fixSortData(data);
    return this.mapContainers(input, data);
  }

  //#region Fixing
  private fixSortValues(value: number) {
    return value / this._FIX;
  }

  private fixSortData(data: BINPACKINGJS_BESTFIT[]) {
    data.forEach((bestFit) => {
      bestFit.organized.items.forEach((i) => {
        i.depth = this.fixSortValues(i.depth);
        i.height = this.fixSortValues(i.height);
        i.width = this.fixSortValues(i.width);

        i.position = [
          this.fixSortValues(i.position[0]),
          this.fixSortValues(i.position[1]),
          this.fixSortValues(i.position[2]),
        ];
      });
    });
  }
  //#endregion Fixing

  //#region Maps
  private mapContainers(input: IInput, bestFitGroup: BINPACKINGJS_BESTFIT[]) {
    let previous: BoxTrixContainer;

    return bestFitGroup
      .map((bestFit, index) => {
        const original = input.stages.find(
          (s) => s.id === bestFit.organized.name
        );

        if (!original) return undefined;

        const container = new BoxTrixContainer(
          original?.id || '',
          original?.name || '',
          original?.detail || '',
          {
            position: { x: 0, y: 0, z: 0 },
            means: {
              width: original?.width || 1,
              height: original?.height || 1,
              depth: original?.depth || 1,
            },
          }
        );

        const items = this.mapItems(original, bestFit);
        container.setItems(items.fitted);
        container.setUnfittedItems(items.unffited);

        container.setFixedMeans({
          width: bestFit.width,
          height: bestFit.height,
          depth: bestFit.depth,
        });
        container.setGlobalStep(index);
        container.setGlobalSteps(previous?.itemCount ?? 0);

        return (previous = container);
      })
      .filter((x) => x) as BoxTrixContainer[];
  }

  private mapItems(input: IStage, bestFit: BINPACKINGJS_BESTFIT) {
    const fitted = bestFit.organized.items.map((binItem) => {
      const item =
        input.items.find((i) => i.id === binItem.name) || ({} as IBox);

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

    const unffited = input.items
      .filter((x) => !bestFit.organized.items.find((y) => y.name === x.id))
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

  private findBestFit(input: IInput): BINPACKINGJS_BESTFIT[] {
    const sequence = input.stages.map((stage) => {
      const items = stage.items;
      const counter = items.length;

      let minWidth = false;
      let minHeight = false;
      let minDepth = false;

      let width = stage.width;
      let height = stage.height;
      let depth = stage.depth;

      let firstIteration = true;

      let previous = {} as BINPACKINGJS_CONTAINER;
      while (!minWidth || !minHeight || !minDepth) {
        const s = {
          id: stage.id,
          name: stage.name,
          width,
          height,
          depth,
        } as IStage;
        const organized = this.mainLogic(s, items);

        if (organized.items.length >= counter) {
          if (!minWidth) --width;
          else if (!minHeight) --height;
          else if (!minDepth) --depth;

          firstIteration = false;
          previous = organized;
        } else {
          if (firstIteration) {
            return {
              organized,
              width,
              height,
              depth,
            };
          }

          if (!minWidth) {
            minWidth = true;
            ++width;
          } else if (!minHeight) {
            minHeight = true;
            ++height;
          } else if (!minDepth) {
            minDepth = true;
            ++depth;
          }
        }
      }

      return {
        organized: previous,
        width,
        height,
        depth,
      };
    });

    return sequence.flatMap((x) => x);
  }

  //#endregion Algorithm
}
