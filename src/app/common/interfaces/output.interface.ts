export interface OutputObject {
  sequence: Order[];
}

export interface Order {
  depth: number;
  height: number;
  width: number;
  weight: number;

  name: string;

  allowedRotation: number[];
  position: number[];
  rotationType: number;
}
