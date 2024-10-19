import { Container } from './Container.class';
import { RenderedController } from './Rendered.controller';

export class Project {
  public get containers() {
    return this._containers;
  }

  private _items: RenderedController[];
  public get items() {
    return this._items;
  }

  constructor(private _containers: Container[]) {
    this._items = this._containers
      .map((container) => container.items)
      .flatMap((item) => item);
  }
}
