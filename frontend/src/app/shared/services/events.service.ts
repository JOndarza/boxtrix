import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export const enum AppEvent {
  LOADING = 'LOADING',
  LOADED = 'LOADED',

  RENDERING = 'RENDERING',
  RENDERED = 'RENDERED',

  RAYCAST = 'RAYCAST',
  CLICKED = 'CLICKED',
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private map: Record<string, Subject<any>> = {};

  get<T = void>(event: AppEvent): Subject<T> {
    const obj = this.map[event];
    return obj ? obj : (this.map[event] = new Subject<T>());
  }
}
