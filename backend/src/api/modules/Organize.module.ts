/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleBase } from '@api/common/module.base';
import {
  IOrganizeService,
  SymbolOrganizeService,
} from '@application/interfaces/Organize.service.interface';
import { IInput } from '@domain/interfaces/structures/Input.interface';

export class OrganizeModule extends ModuleBase {
  endpoint = '/organize';

  configureRoutes() {
    this.post<IOrganizeService, IInput>(
      SymbolOrganizeService,
      'sort',
      (service, request) => service.sort(request),
      false,
    );
  }
}
