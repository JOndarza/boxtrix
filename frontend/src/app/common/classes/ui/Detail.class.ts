import { Project } from '@common/classes/rendered/Project.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';

export class Detail {
  private _fitted: RenderedController[];
  public get fitted() {
    return this._fitted;
  }

  constructor() {
    this._fitted = [];
  }

  load(data: Project) {
    this._fitted = [...data.items].sort((a, b) => a.globalStep - b.globalStep);
  }
}
