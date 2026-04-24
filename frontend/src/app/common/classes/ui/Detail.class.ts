import { Project } from '@common/classes/rendered/Project.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';

const UNFITTED_AREA_NAME = 'UNFITTED';

export class Detail {
  private _fitted: RenderedController[] = [];
  public get fitted() {
    return this._fitted;
  }

  // H4 — boxes the algorithm could not place go here, never silently dropped
  private _unfitted: RenderedController[] = [];
  public get unfitted() {
    return this._unfitted;
  }

  load(data: Project): void {
    const fitted: RenderedController[] = [];
    const unfitted: RenderedController[] = [];

    for (const area of data.areas) {
      if (area.name === UNFITTED_AREA_NAME) {
        unfitted.push(...area.items);
      } else {
        fitted.push(...area.items);
      }
    }

    this._fitted = fitted.sort((a, b) => a.globalStep - b.globalStep);
    this._unfitted = unfitted;
  }
}
