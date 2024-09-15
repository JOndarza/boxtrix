import { Injectable } from '@angular/core';
import { Color, ColorRepresentation } from 'three';
import { AppEvent, EventsService } from './events.service';

export const enum FocusedItem {
  RAYCAST = 'RAYCAST',
  CLICKED = 'CLICKED',
}

export class Render {
  public get obj3D() {
    return this._obj3D;
  }

  constructor(private _obj3D: any) {}

  changeColorEmissive(color: ColorRepresentation) {
    if (!this.obj3D) return;

    this.obj3D.material.emissive = new Color(color);
  }
}

export class FocusedData {
  public get render() {
    return this._render;
  }

  constructor(private _render: Render) {}

  getObj3D() {
    return this.render?.obj3D;
  }
}

@Injectable({ providedIn: 'root' })
export class FocusManagerService {
  private _map: any = {};

  constructor(private _events: EventsService) {}

  set(item: FocusedItem, obj3D: any) {
    const data = (this._map[item] = new FocusedData(new Render(obj3D)));

    let event = this.type2Event(item);
    if (event) {
      const id = obj3D?.uuid ?? undefined;
      this._events.get(event).emit(id);
    }

    return data;
  }

  get(item: FocusedItem): FocusedData {
    return this._map[item];
  }

  getObj3D(item: FocusedItem) {
    return this.get(item)?.getObj3D();
  }

  private type2Event(item: FocusedItem) {
    switch (item) {
      case FocusedItem.RAYCAST:
        return AppEvent.RAYCAST;
      case FocusedItem.CLICKED:
        return AppEvent.CLICKED;
      default:
        return undefined;
    }
  }
}
