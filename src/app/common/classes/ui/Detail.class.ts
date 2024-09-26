import _ from 'lodash';
import { Project } from '../rendered/Project.class';
import { RenderedController } from '../rendered/Rendered.controller';

export class Detail {
  private _fitted: RenderedController[];
  public get fitted() {
    return this._fitted;
  }

  constructor() {
    this._fitted = [];
  }

  load(data: Project) {
    this._fitted = _.orderBy(data.items, (x) => x.globalStep, 'asc');
  }
}
