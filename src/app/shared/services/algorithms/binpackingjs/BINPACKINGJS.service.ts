import { Injectable } from '@angular/core';
import { Container } from '@common/classes/rendered/Container.class copy';
import { Project } from '@common/classes/rendered/Project.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { IMeasurements } from '@common/interfaces/Data.interface';
import { IBox, IProjectInput } from '@common/interfaces/Input.interface';
import { BP3D } from 'binpackingjs';
import _ from 'lodash';

import { IAlgorithmServiceV2 } from '../_interfaces/algorithm.service.interface';
import { BINPACKINGJS_BESTFIT, BINPACKINGJS_CONTAINER } from './_common';
import { newId } from '@common/functions/id.function';

const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class BINPACKINGJSService implements IAlgorithmServiceV2 {
  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  sort(input: IProjectInput) {
    const containers = this.mapContainers(input);
    return new Project(containers);
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
  private mapContainers(input: IProjectInput) {
    const containers = _.chain(input.containers)
      .map(
        (x) =>
          new Container(x.id, x.name, x.detail, {
            means: x,
            position: x,
          })
      )
      .orderBy((x) => x.means.getVolumen(), 'desc')
      .value();

    let unfitted = input.boxes;
    let previous: Container | null = null;

    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];

      const data = this.findBestFit(container, unfitted);
      this.fixSortData(data);

      const items = this.mapItems(data, input.boxes);
      container.setItems(items);

      container.fixedMeans.set(data);
      container.setGlobalStep(i);
      container.setGlobalSteps(previous?.itemCount ?? 0);

      unfitted = this.getUnffited(data, unfitted);
      if (!unfitted.length) break;

      previous = container;
    }

    const unfittedContainer = this.getContainerUnfitted(unfitted);
    if (unfittedContainer) {
      unfittedContainer.setGlobalStep(containers.length + 1);
      // HACK
      unfittedContainer.setGlobalSteps((previous as any)?.itemCount ?? 0);
      containers.push(unfittedContainer);
    }

    return containers;
  }

  private mapItems(data: BINPACKINGJS_BESTFIT, allItems: IBox[]) {
    return data.organized.items.map((binItem) => {
      const item = allItems.find((i) => i.id === binItem.name) || ({} as IBox);

      const data = new RenderedController(
        item.id,
        item.name,
        item.detail || '',
        {
          type: 'box',
          targable: true,
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
  }

  private getUnffited(data: BINPACKINGJS_BESTFIT, items: IBox[]) {
    return items.filter(
      (x) => !data.organized.items.find((y) => y.name === x.id)
    );
  }

  private getContainerUnfitted(unfitted: IBox[]) {
    if (!unfitted.length) return null;

    const volumen = unfitted.reduce(
      (acc, curr) => acc + curr.width * curr.height * curr.depth,
      0
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

    const container = new Container(newId(), 'UNFITTED', 'UNFITTED', {
      means,
      position: { x: 0, y: 0, z: 0 },
    });

    const data = this.findBestFit(container, unfitted);
    container.fixedMeans.set(data);
    container.means.set(data);
    container.setItems(this.mapItems(data, unfitted));

    return container;
  }
  //#endregion Maps

  //#region Algorithm
  private mainLogic(stage: Container, items: IBox[]): BINPACKINGJS_CONTAINER {
    let packer = new Packer();

    let bin = new Bin(
      stage.id,
      stage.means.width,
      stage.means.height,
      stage.means.depth,
      0
    );
    packer.addBin(bin);

    items.forEach((item) =>
      packer.addItem(
        new Item(item.id, item.width, item.height, item.depth, item.weight || 1)
      )
    );

    packer.pack();

    return bin;
  }

  private findBestFit(
    original: Container,
    items: IBox[]
  ): BINPACKINGJS_BESTFIT {
    let sorted = this.mainLogic(original, items);

    if (sorted.items.length < items.length)
      items = items.filter((x) => sorted.items.find((y) => y.name === x.id));

    let minWidth = false;
    let minHeight = false;
    let minDepth = false;

    const means = {
      width: original.means.width,
      height: original.means.height,
      depth: original.means.depth,
    } as IMeasurements;

    let previous = {} as BINPACKINGJS_CONTAINER;

    while (!minWidth || !minHeight || !minDepth) {
      const stage = new Container(original.id, original.name, original.detail, {
        means,
        position: { x: 0, y: 0, z: 0 },
      });

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
