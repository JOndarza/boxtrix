import { Stack } from './Stack.class';
import { Stackable } from './Stackable.class';
import { StackPlacement } from './StackPlacement.class';

export class Container extends Stackable {
  stack: Stack;

  constructor(
    public override id: string,
    public override name: string,
    public override step: number,
    public override dx: number,
    public override dy: number,
    public override dz: number,
    public loadDx: number,
    public loadDy: number,
    public loadDz: number
  ) {
    super(name, id, step, dx, dy, dz);

    this.loadDx = loadDx;
    this.loadDy = loadDy;
    this.loadDz = loadDz;

    this.stack = new Stack(step);
  }

  add(stackPlacement: StackPlacement): void {
    this.stack.add(stackPlacement as any);
  }
}
