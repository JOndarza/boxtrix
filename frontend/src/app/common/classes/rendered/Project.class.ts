import { IStats } from '@common/dtos/Output.interface';
import { Units } from '@common/enums/Units.enum';

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

  constructor(
    private _areas: Area[],
    readonly units: Units = 'cm',
    readonly stats: IStats,
  ) {
    this._items = this._areas.map((area) => area.items).flatMap((item) => item);
  }
}
