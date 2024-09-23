export interface BINPACKINGJS_ITEM {
  name: string;

  position: number[];
  allowedRotation: number[];
  rotationType: number;

  width: number;
  height: number;
  depth: number;
}

export interface BINPACKINGJS_CONTAINER {
  name: string;
  items: BINPACKINGJS_ITEM[];

  width: number;
  height: number;
  depth: number;
  maxWeight: number;
}

export interface BINPACKINGJS_BESTFIT {
  organized: BINPACKINGJS_CONTAINER;
  unffited?: BINPACKINGJS_BESTFIT[];
  width: number;
  height: number;
  depth: number;
}
