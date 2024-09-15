export const enum RotationType {
  RotationType_WHD = 0,
  RotationType_HWD = 1,
  RotationType_HDW = 2,
  RotationType_DHW = 3,
  RotationType_DWH = 4,
  RotationType_WDH = 5,
}

export class Stackable {
  constructor(
    public name: string,
    public id: string,
    public step: number,
    public dx: number,
    public dy: number,
    public dz: number,
    public type: 'box' = 'box'
  ) {}

  rotate(rotation: RotationType) {
    const W = this.dx;
    const H = this.dy;
    const D = this.dz;

    switch (rotation) {
      case RotationType.RotationType_HWD:
        this.dx = H;
        this.dy = W;
        break;
      case RotationType.RotationType_HDW:
        this.dx = H;
        this.dy = D;
        this.dz = W;
        break;
      case RotationType.RotationType_DHW:
        this.dx = D;
        this.dy = H;
        this.dz = W;
        break;
      case RotationType.RotationType_DWH:
        this.dx = D;
        this.dy = W;
        this.dz = H;
        break;
      case RotationType.RotationType_WDH:
        this.dx = W;
        this.dy = D;
        this.dz = H;
        break;
    }
  }
}
