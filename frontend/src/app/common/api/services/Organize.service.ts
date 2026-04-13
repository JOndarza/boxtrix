import { Injectable } from '@angular/core';
import { ApiServiceBase } from '../apiService.base';
import { IInput } from '@common/dtos/Input.interface';
import { IOutput } from '@common/dtos/Output.interface';

@Injectable({ providedIn: 'root' })
export class OrganizeService extends ApiServiceBase {
  override endpoint = 'organize';

  sort<TBody = IInput>(data: TBody) {
    return this.post<IOutput, TBody>('sort', data);
  }
}
