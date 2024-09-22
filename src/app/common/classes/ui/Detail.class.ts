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

  load(data: BoxTrixContainer[]) {
    this._fitted = data.map((x) => x.items.map((p) => p)).flatMap((x) => x);
    this._unfitted = data
      .map((x) => x.unffitedItems.map((p) => p))
      .flatMap((x) => x);
  }
}
