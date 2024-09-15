import { Injectable } from '@angular/core';
import { InputObject } from '@common/classes/InputObject';
import { Stackable } from '@common/classes/Stackable.class';
import { StackPlacement } from '@common/classes/StackPlacement.class';
import { Order } from '@common/interfaces/Output.interface';
import { BP3D } from 'binpackingjs';

import { AppEvent, EventsService } from './events.service';

const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class ContextService {
  private _input!: InputObject;
  public get input() {
    return this._input;
  }

  private _output!: Order[];
  public get output() {
    return this._output;
  }

  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  constructor(private _events: EventsService) {}

  loadData(data: InputObject) {
    this._input = data;

    this._output = this.sort();

    this._input.containers.forEach((container) => {
      container.stack.placements = this.output.map((item, index) => {
        const stackable = new Stackable(
          item.name,
          item.name,
          index,
          item.width,
          item.height,
          item.depth
        );

        stackable.rotate(item.rotationType);

        return {
          stackable,
          step: index + 1,
          x: item.position[0],
          y: item.position[1],
          z: item.position[2],
        } as StackPlacement;
      });
    });

    this.fixSteps(this.input);

    this._events.get(AppEvent.LOADED).emit();
  }

  private sort() {
    if (!this.input) return [];

    let packer = new Packer();

    const sequence = this.input.containers.map((container) => {
      let bin = new Bin(
        container.name,
        container.dx,
        container.dy,
        container.dz,
        0
      );

      packer.addBin(bin);

      container.stack.placements.forEach((x) => {
        const stackable = x.stackable;
        packer.addItem(
          new Item(stackable.id, stackable.dx, stackable.dy, stackable.dz, 0)
        );
      });

      packer.pack();

      this.fixSortData(bin.items);

      return bin.items as Order[];
    });

    return sequence.flatMap((x) => x);
  }

  private fixSortValues(value: number) {
    return value / this._FIX;
  }

  private fixSortData(items: Order[]) {
    items?.forEach((element: Order) => {
      element.depth = this.fixSortValues(element.depth);
      element.height = this.fixSortValues(element.height);
      element.width = this.fixSortValues(element.width);
      element.weight = this.fixSortValues(element.weight);

      element.position = [
        this.fixSortValues(element.position[0]),
        this.fixSortValues(element.position[1]),
        this.fixSortValues(element.position[2]),
      ];
    });
  }

  private fixSteps(input: InputObject) {
    let step = -1;
    input.containers.forEach((x) => {
      x.step = ++step;
      x.stack.step = x.step;
      x.stack.placements.forEach((p) => {
        p.step = ++step;
        p.stackable.step = p.step;
        p.stackable.type = 'box';
      });
    });
  }
}
