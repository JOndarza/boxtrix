import { Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { Project } from '@common/classes/rendered/Project.class';

export enum AppEvent {
  LOADING = 'LOADING',
  LOADED = 'LOADED',

  RENDERING = 'RENDERING',
  RENDERED = 'RENDERED',

  RAYCAST = 'RAYCAST',
  CLICKED = 'CLICKED',
}

type EventPayloadMap = {
  [AppEvent.LOADING]: void;
  [AppEvent.LOADED]: Project;
  [AppEvent.RENDERING]: void;
  [AppEvent.RENDERED]: void;
  [AppEvent.RAYCAST]: string;
  [AppEvent.CLICKED]: string;
};

// LOADED uses ReplaySubject(1) so late subscribers (e.g. ContextService
// created after the event fires during hot-reload) still receive the last value.
const REPLAY_EVENTS = new Set<AppEvent>([AppEvent.LOADED]);

@Injectable({ providedIn: 'root' })
export class EventsService {
  private _map = new Map<AppEvent, Subject<unknown>>();

  get<K extends AppEvent>(event: K): Subject<EventPayloadMap[K]> {
    if (!this._map.has(event)) {
      const subject: Subject<unknown> = REPLAY_EVENTS.has(event)
        ? new ReplaySubject<unknown>(1)
        : new Subject<unknown>();
      this._map.set(event, subject);
    }
    return this._map.get(event) as Subject<EventPayloadMap[K]>;
  }
}
