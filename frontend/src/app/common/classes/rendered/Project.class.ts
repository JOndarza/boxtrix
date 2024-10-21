import { Area } from './Area.class';
import { RenderedController } from './Rendered.controller';

export class Project {
  public get areas() {
    return this._areas;
  }

  private _items: RenderedController[];
  public get items() {
    return this._items;
  }

  constructor(private _areas: Area[]) {
    this._items = this._areas.map((area) => area.items).flatMap((item) => item);
  }
}
