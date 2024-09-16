import { Injectable } from '@angular/core';
import { Container } from '@common/classes/Container.class';
import { InputObject } from '@common/classes/InputObject';
import { Stackable } from '@common/classes/Stackable.class';
import { IBin } from '@common/interfaces/output.interface';
import { BP3D } from 'binpackingjs';

import { AppEvent, EventsService } from './events.service';
import { debounceTime } from 'rxjs';

const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class ContextService {
  private _input!: InputObject;
  public get input() {
    return this._input;
  }

  private _bin!: IBin;
  public get bin() {
    return this._bin;
  }

  constructor(private _events: EventsService) {
    this._events
      .get<IBin>(AppEvent.LOADED)
      .pipe(debounceTime(50))
      .subscribe(this.load.bind(this));
  }

  private load(data: IBin) {
    this._bin = data;

    this._input = {
      containers: this._bin.stages.map((stage) => {
        const container = new Container(
          stage.id,
          stage.name,
          0,
          stage.width,
          stage.height,
          stage.depth,
          0,
          0,
          0
        );

        stage.items.forEach((item) => {
          const stackable = new Stackable(
            item.name,
            item.id,
            0,
            item.width,
            item.height,
            item.depth
          );

          stackable.rotate(item.rotationType);

          container.add({
            stackable,
            step: 0,
            x: item.position[0],
            y: item.position[1],
            z: item.position[2],
          });
        });
        return container;
      }),
    };

    this.fixSteps(this.input);

    this._events.get(AppEvent.RENDERING).emit();
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
