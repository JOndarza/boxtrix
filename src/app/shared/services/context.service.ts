import { Injectable } from '@angular/core';
import { Project } from '@common/classes/rendered/Project.class';
import { Detail } from '@common/classes/ui/Detail.class';
import _ from 'lodash';
import { debounceTime } from 'rxjs';

import { AppEvent, EventsService } from './events.service';
import { RewindManagerService } from './RewindManager.service';

@Injectable({ providedIn: 'root' })
export class ContextService {
  private _project!: Project;
  public get project() {
    return this._project;
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
      .get<Project>(AppEvent.LOADED)
      .pipe(debounceTime(50))
      .subscribe(this.load.bind(this));

    this._detail = new Detail();
  }

  private load(data: Project) {
    this._project = data;
    this._detail.load(this.project);
    this._rewind.set(1, 1, _.last(this._detail.fitted)?.globalStep ?? 1);
    this._events.get(AppEvent.RENDERING).emit();
  }
}
