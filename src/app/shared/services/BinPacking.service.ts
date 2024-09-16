import { Injectable } from '@angular/core';
import { IBox, IInput, IStage } from '@common/interfaces/Input.interface';
import { IBin, IBinItem, IBinStage } from '@common/interfaces/output.interface';
import { BP3D } from 'binpackingjs';
import _ from 'lodash';

const { Item, Bin, Packer } = BP3D;

@Injectable({ providedIn: 'root' })
export class BinPackingService {
  private _FACTOR = 5;
  private _FIX = 10 ** this._FACTOR;

  sort(input: IInput): IBin {
    if (!input) return {} as IBin;

    input.stages.forEach((stage) => {
      stage.id = this.newId();
      stage.items?.forEach((item) => (item.id = this.newId()));
    });

    const data = this.logic(input);

    const bin = {
      units: input.units,
      stages: data.map((binStage) => {
        const stage =
          input.stages.find((s) => s.name === binStage.name) || ({} as IStage);
        const { items } = binStage;
        const s = {
          id: stage.id,
          name: stage.name,
          detail: stage.detail,
          width: binStage.width,
          height: binStage.height,
          depth: binStage.depth,
          items: items.map((binItem) => {
            const item =
              stage.items.find((i) => i.id === binItem.name) || ({} as IBox);

            return {
              id: item.id,
              name: item.name,
              detail: item.detail,
              width: binItem.width,
              height: binItem.height,
              depth: binItem.depth,
              weight: binItem.weight,
              position: binItem.position,
              rotationType: binItem.rotationType,
              allowedRotation: binItem.allowedRotation,
            };
          }),
        } as IBinStage;

        return s;
      }),
    };

    this.fixSortData(bin);

    console.log('bin', bin);
    return bin;
  }

  private logic(input: IInput) {
    let packer = new Packer();

    const sequence = input.stages.map((stage) => {
      let bin = new Bin(stage.name, stage.width, stage.height, stage.depth, 0);
      packer.addBin(bin);

      stage.items.forEach((item) =>
        packer.addItem(
          new Item(item.id, item.width, item.height, item.depth, item.weight)
        )
      );

      packer.pack();

      return bin as IBinStage;
    });

    return sequence.flatMap((x) => x);
  }

  private fixSortValues(value: number) {
    return value / this._FIX;
  }

  private fixSortData(bin: IBin) {
    bin.stages.forEach((s) => {
      s.depth = this.fixSortValues(s.depth);
      s.height = this.fixSortValues(s.height);
      s.width = this.fixSortValues(s.width);

      s.items.forEach((i) => {
        i.depth = this.fixSortValues(i.depth);
        i.height = this.fixSortValues(i.height);
        i.width = this.fixSortValues(i.width);
        i.weight = this.fixSortValues(i.weight || 0);

        i.position = [
          this.fixSortValues(i.position[0]),
          this.fixSortValues(i.position[1]),
          this.fixSortValues(i.position[2]),
        ];
      });

      s.items = _.orderBy(
        s.items,
        (s) => Math.sqrt(s.position[0] ** 2 + s.position[2] ** 2),
        'asc'
      );
    });
  }

  private newId() {
    // First character is an 'a', it's good practice to tag id to begin with a letter
    return 'axxxxxxxxxxx'.replace(/[x]/g, () => {
      // eslint-disable-next-line no-bitwise
      const val = (Math.random() * 16) | 0;
      return val.toString(16);
    });
  }
}
