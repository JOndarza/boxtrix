import { Color } from 'three';
import { Container } from '../classes/Container.class';
import { Point } from '../classes/Point.class';
import { Stackable } from '../classes/Stackable.class';

export interface ColorScheme {
  getPoint(point: Point): Color;
  getStackable(stackable: Stackable): Color;
  getColorScheme(container: Container): ColorScheme;
}
