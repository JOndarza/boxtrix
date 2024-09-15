import { EventEmitter, Injectable } from '@angular/core';

export const enum AppEvent {
  LOADED = 'LOADED',
  RAYCAST = 'RAYCAST',
  CLICKED = 'CLICKED',
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private map: any = {};

  get<T = any>(event: AppEvent): EventEmitter<T> {
    const obj = this.map[event];
    return obj ? obj : (this.map[event] = new EventEmitter());
  }
}
