import { Injectable } from '@angular/core';
import { IInput } from '@common/dtos/Input.interface';
import { IOutput } from '@common/dtos/Output.interface';

import { ApiServiceBase } from '../apiService.base';

const ORGANIZE_ENDPOINT = 'organize';

@Injectable({ providedIn: 'root' })
export class OrganizeService extends ApiServiceBase {
  override endpoint = ORGANIZE_ENDPOINT;

  sort<TBody = IInput>(data: TBody) {
    return this.post<IOutput, TBody>('sort', data);
  }
}
