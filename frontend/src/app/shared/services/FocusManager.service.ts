import { Injectable } from '@angular/core';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { Color, Mesh, Object3D } from 'three';

import { ConstantsService } from './constants.service';
import { AppEvent, EventsService } from './events.service';

@Injectable({ providedIn: 'root' })
export class FocusManagerService {
  private _obj3D!: Object3D;
  public get obj3D() {
    return this._obj3D;
  }

  constructor(
    private _constants: ConstantsService,
    private _events: EventsService
  ) {}

  set(obj3D: Object3D) {
    if (this.obj3D) this.select(false);

    this._obj3D = obj3D;
    this.select(true);

    this._events.get(AppEvent.CLICKED).next();
  }

  private select(selected: boolean) {
    const color = selected
      ? this._constants.BOX_COLOR_RAYCAST
      : this._constants.BOX_COLOR_UNSET;

    if (this.obj3D instanceof Mesh) {
      const material = this.obj3D.material;
      material.emissive = new Color(color);
    }

    (this.obj3D.userData as RenderedController).selected = selected;
  }
}
