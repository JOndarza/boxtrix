import { Point } from './Point.class';
import { Stackable } from './Stackable.class';

export class StackPlacement {
  constructor(
    public stackable: Stackable,
    public step: number,
    public x: number,
    public y: number,
    public z: number,
    public points?: Array<Point>
  ) {}
}
