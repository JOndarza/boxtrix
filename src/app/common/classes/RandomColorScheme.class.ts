import randomColor from 'randomcolor';
import { Color } from 'three';

import { ColorScheme } from '../interfaces/ColorScheme';
import { Container } from './Container.class';
import { Point } from './Point.class';
import { Stackable } from './Stackable.class';

export class RandomColorScheme implements ColorScheme {
  getPoint(point: Point): Color {
    return new Color(randomColor());
  }
  getStackable(stackable: Stackable): Color {
    return new Color(randomColor());
  }
  getColorScheme(container: Container): ColorScheme {
    return this;
  }
}
