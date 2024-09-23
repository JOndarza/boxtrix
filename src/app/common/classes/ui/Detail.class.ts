import { BoxTrixContainer } from '../news/Container.class';
import { RenderedController } from '../news/Rendered.controller';

export class Detail {
  private _fitted: RenderedController[];
  public get fitted() {
    return this._fitted;
  }

  private _unfitted: RenderedController[];
  public get unfitted() {
    return this._unfitted;
  }

  constructor() {
    this._fitted = [];
    this._unfitted = [];
  }

  load(data: BoxTrixContainer) {
    this._fitted = data.items;
    this._unfitted = data.unffited;
  }
}
