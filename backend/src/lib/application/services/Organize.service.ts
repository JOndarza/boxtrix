import 'reflect-metadata';

import { IOrganizeService } from '@application/interfaces/Organize.service.interface';
import {
  IOrganizeAlgorithmService,
  SymbolBINPACKINGJSService,
} from '@domain/interfaces/OrganizeAlgorithm.service.interface';
import { IInput } from '@domain/interfaces/structures/Input.interface';
import {
  IOrganizedArea,
  IOrganizedBox,
  IOutput,
} from '@domain/interfaces/structures/Output.interface';
import { inject, injectable } from 'inversify';

@injectable()
export class OrganizeService implements IOrganizeService {
  constructor(
    @inject(SymbolBINPACKINGJSService)
    private _algorithmLocal: IOrganizeAlgorithmService,
  ) {}

  sort(input: IInput): IOutput {
    const data = this._algorithmLocal.sort(input);
    this.orderItems(data);
    return data;
  }

  private orderItems(data: IOutput) {
    data.areas.forEach((area) => {
      if (!area.boxes?.length) return;

      const items = area.boxes.sort(
        (a, b) =>
          this.getDistanceAtGlobalPosition(area, a) -
          this.getDistanceAtGlobalPosition(area, b),
      );
      area.boxes = items;
    });
  }

  private getDistanceAtGlobalPosition(
    area: IOrganizedArea,
    box: IOrganizedBox,
  ) {
    return Math.sqrt(
      (box.position.x - area.x) ** 2 + (box.position.z - area.z) ** 2,
    );
  }
}
