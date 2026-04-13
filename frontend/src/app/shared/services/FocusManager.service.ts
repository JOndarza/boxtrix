import { Injectable, inject } from '@angular/core';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { Color, Mesh, Object3D } from 'three';

import { ConstantsService } from './Constants.service';
import { AppEvent, EventsService } from './Events.service';

@Injectable({ providedIn: 'root' })
export class FocusManagerService {
  private readonly _constants = inject(ConstantsService);
  private readonly _events = inject(EventsService);

  private _obj3D!: Object3D;
  public get obj3D() {
    return this._obj3D;
  }

  set(obj3D: Object3D): void {
    if (this.obj3D) this.select(false);

    this._obj3D = obj3D;
    this.select(true);

    const id = (obj3D.userData as RenderedController).id;
    this._events.get(AppEvent.RAYCAST).next(id);
  }

  private select(selected: boolean): void {
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
