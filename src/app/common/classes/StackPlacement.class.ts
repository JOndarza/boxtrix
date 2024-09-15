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

  generatePoints() {
    this.points = [
      {
        x: this.x,
        y: this.y,
        z: this.stackable.dz,
        dx: 0,
        dy: 0,
        dz: 0,
      },
      {
        x: this.x,
        y: this.stackable.dy,
        z: this.z,
        dx: 0,
        dy: 0,
        dz: 0,
      },
      {
        x: this.stackable.dx,
        y: this.y,
        z: this.z,
        dx: 0,
        dy: 0,
        dz: 0,
      },
    ];
  }
}
