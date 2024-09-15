import { StackPlacement } from './StackPlacement.class';

export class Stack {
  placements: Array<StackPlacement>;

  constructor(public step: number) {
    this.step = step;
    this.placements = new Array();
  }

  add(placement: StackPlacement) {
    this.placements.push(placement);
  }
}
