import { Injectable } from '@angular/core';
import { BoxTrixContainer } from '@common/classes/news/Container.class';
import { debounceTime } from 'rxjs';

import { AppEvent, EventsService } from './events.service';
import { Detail } from '@common/classes/ui/Detail.class';
import { RewindManagerService } from './RewindManager.service';
import _ from 'lodash';

@Injectable({ providedIn: 'root' })
export class ContextService {
  private _container!: BoxTrixContainer;
  public get container() {
    return this._container;
  }

  private _detail: Detail;
  public get detail() {
    return this._detail;
  }

  constructor(
    private _rewind: RewindManagerService,
    private _events: EventsService
  ) {
    this._events
      .get<BoxTrixContainer>(AppEvent.LOADED)
      .pipe(debounceTime(50))
      .subscribe(this.load.bind(this));

    this._detail = new Detail();
  }

  private load(data: BoxTrixContainer) {
    this._container = data;
    this._detail.load(this.container);
    this._rewind.set(1, 1, _.last(this._detail.fitted)?.globalStep ?? 1);
    this._events.get(AppEvent.RENDERING).emit();
  }
}
