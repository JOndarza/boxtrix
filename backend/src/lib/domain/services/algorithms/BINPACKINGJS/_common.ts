export interface IBINPACKINGJSItem {
  name: string;

  position: number[];
  rotationType: number;

  width: number;
  height: number;
  depth: number;

  weight: number;
}

export interface IBINPACKINGJSContainer {
  name: string;
  items: IBINPACKINGJSItem[];

  width: number;
  height: number;
  depth: number;
  maxWeight: number;
}

export interface IBINPACKINGJSBestFit {
  organized: IBINPACKINGJSContainer;
  unfitted?: IBINPACKINGJSBestFit[];
  width: number;
  height: number;
  depth: number;
}
