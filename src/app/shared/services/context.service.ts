import { Injectable } from '@angular/core';
import { Container } from '@common/classes/Container.class';
import { InputObject } from '@common/classes/InputObject';
import { Stackable } from '@common/classes/Stackable.class';
import { IBin } from '@common/interfaces/output.interface';

import { AppEvent, EventsService } from './events.service';
import { debounceTime } from 'rxjs';
import { BoxTrixContainer } from '@common/classes/news/Container.class';

@Injectable({ providedIn: 'root' })
export class ContextService {
  private _bin!: IBin;
  public get bin() {
    return this._bin;
  }

  private _containers!: BoxTrixContainer[];
  public get containers() {
    return this._containers;
  }

  constructor(private _events: EventsService) {
    this._events
      .get<IBin>(AppEvent.LOADED)
      .pipe(debounceTime(50))
      .subscribe(this.load.bind(this));
  }

  private load(data: IBin) {
    this._bin = data;

    let container: BoxTrixContainer;
    this._containers = this._bin.stages.map((stage, index) => {
      const c = new BoxTrixContainer(stage.id, stage.name, stage.detail || '', {
        position: { x: 0, y: 0, z: 0 },
        means: stage,
      });
      c.setData(stage.items);
      if (stage.fixedIMeans) c.setFixedMeans(stage.fixedIMeans);
      c.setGlobalStep(index);
      c.setGlobalSteps(container?.itemCount ?? 0);
      return (container = c);
    });

    this._events.get(AppEvent.RENDERING).emit();
  }
}
