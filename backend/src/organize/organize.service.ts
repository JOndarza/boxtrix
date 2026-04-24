import { Injectable } from '@nestjs/common';
import { IInput } from '@domain/interfaces/structures/Input.interface';
import {
  IOrganizedArea,
  IOrganizedBox,
  IOutput,
} from '@domain/interfaces/structures/Output.interface';
import { BINPACKINGJSService } from '@domain/services/algorithms/BINPACKINGJS/BINPACKINGJS.service';

@Injectable()
export class OrganizeService {
  constructor(private readonly _algorithmLocal: BINPACKINGJSService) {}

  sort(input: IInput): IOutput {
    const data = this._algorithmLocal.sort(input);
    this.orderItems(data);
    return data;
  }

  private orderItems(data: IOutput) {
    data.areas.forEach((area) => {
      if (!area.boxes?.length) return;

      area.boxes = area.boxes.sort((a, b) => {
        // Primary: Y ascending so bottom boxes render before top boxes
        const dy = a.position.y - b.position.y;
        if (dy !== 0) return dy;
        // Secondary: XZ distance from the area origin as tiebreaker within the same row
        return (
          this.getDistanceAtGlobalPosition(area, a) -
          this.getDistanceAtGlobalPosition(area, b)
        );
      });
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
