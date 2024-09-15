import { Color } from 'three';

import { ColorScheme } from '../interfaces/ColorScheme';
import { Container } from './Container.class';
import { Point } from './Point.class';
import { Stackable } from './Stackable.class';

export class MemoryColorScheme implements ColorScheme {
  private _map: Map<string, Color>;

  constructor(private _delegate: ColorScheme) {
    this._map = new Map();
  }

  getStackable(stackable: Stackable): Color {
    if (!stackable.id) {
      // use random
      return this._delegate.getStackable(stackable);
    }
    // use same as before, for the
    var color = this._map.get(stackable.id);
    if (!color) {
      color = this._delegate.getStackable(stackable);
      this._map.set(stackable.id, color);
    }
    return color;
  }

  getColorScheme(container: Container): ColorScheme {
    return this;
  }

  getPoint(point: Point): Color {
    // use same as before, for the
    var id = `${point.x}x${point.y}x${point.z} ${point.dx}x${point.dy}x${point.dz}`;
    var color = this._map.get(id);
    if (!color) {
      color = this._delegate.getPoint(point);
      this._map.set(id, color);
    }
    return color;
  }
}
