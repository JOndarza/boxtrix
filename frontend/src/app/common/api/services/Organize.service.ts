import { Injectable } from '@angular/core';
import { ApiServiceBase, IRequesConfig } from '../apiService.base';
import { IInput } from '@common/dtos/Input.interface';
import { IOutput } from '@common/dtos/Output.interface';

@Injectable()
export class OrganizeService extends ApiServiceBase {
  override endpoint = 'organize';

  sort<TBody = IInput>(data: TBody, config?: IRequesConfig) {
    return this.post<IOutput, TBody>('sort', data, config);
  }
}
