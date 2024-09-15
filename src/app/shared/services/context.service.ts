import { EventEmitter, Injectable } from '@angular/core';
import { InputObject } from '@common/classes/InputObject';
import { Stackable } from '@common/classes/Stackable.class';
import { StackPlacement } from '@common/classes/StackPlacement.class';
import { Order } from '@common/interfaces/output.interface';

import { BP3D } from 'binpackingjs';
const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class ContextService {
  private _ANGULAR_VELOCITY = 0.01;
  public get ANGULAR_VELOCITY() {
    return this._ANGULAR_VELOCITY;
  }

  private _GRID_SPACING = 1;
  public get GRID_SPACING() {
    return this._GRID_SPACING;
  }

  private _input!: InputObject;
  public get input() {
    return this._input;
  }

  private _output!: Order[];
  public get output() {
    return this._output;
  }

  private _loaded = new EventEmitter();
  public get loaded() {
    return this._loaded;
  }

  private _raycast = new EventEmitter<string>();
  public get raycast() {
    return this._raycast;
  }

  private _clicked = new EventEmitter<string>();
  public get clicked() {
    return this._clicked;
  }

  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  loadData(data: InputObject) {
    this._input = data;

    this._output = this.logic();

    console.log(this.output);

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

    let step = -1;
    this.input.containers.forEach((x) => {
      x.step = ++step;
      x.stack.step = ++step;
      x.stack.placements.forEach((p) => {
        p.step = ++step;
        p.stackable.step = p.step;
        p.stackable.type = 'box';
      });
    });

    console.log(this.input);

    this.loaded.emit();
  }

  private logic() {
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

      this.fixData(bin.items);

      return bin.items as Order[];
    });

    return sequence.flatMap((x) => x);
  }

  private fixData(items: Order[]) {
    items?.forEach((element: Order) => {
      element.depth = this.fixValues(element.depth);
      element.height = this.fixValues(element.height);
      element.width = this.fixValues(element.width);
      element.weight = this.fixValues(element.weight);

      element.position = [
        this.fixValues(element.position[0]),
        this.fixValues(element.position[1]),
        this.fixValues(element.position[2]),
      ];
    });
  }

  private fixValues(value: number) {
    return value / this._FIX;
  }
}
