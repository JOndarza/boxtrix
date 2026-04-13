import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Project } from '@common/classes/rendered/Project.class';
import { Detail } from '@common/classes/ui/Detail.class';
import { debounceTime } from 'rxjs';

import { AppEvent, EventsService } from './Events.service';
import { RewindManagerService } from './RewindManager.service';

@Injectable({ providedIn: 'root' })
export class ContextService {
  private readonly _rewind = inject(RewindManagerService);
  private readonly _events = inject(EventsService);
  private readonly _destroyRef = inject(DestroyRef);

  private _project!: Project;
  public get project() {
    return this._project;
  }

  private _detail = new Detail();
  public get detail() {
    return this._detail;
  }

  constructor() {
    // C1 — takeUntilDestroyed is valid in root services; subscription cleans
    // up if the root injector is ever torn down (e.g. in tests).
    // M9 — LOADED uses ReplaySubject(1) in EventsService so this constructor
    // subscription still receives the last value even if fired before init.
    this._events
      .get(AppEvent.LOADED)
      .pipe(debounceTime(100), takeUntilDestroyed(this._destroyRef))
      .subscribe((data) => this.load(data));
  }

  private load(data: Project): void {
    this._project = data;
    this._detail.load(this.project);
    this._rewind.set(1, 1, this._detail.fitted.at(-1)?.globalStep ?? 1);
    this._events.get(AppEvent.RENDERING).next();
  }
}
