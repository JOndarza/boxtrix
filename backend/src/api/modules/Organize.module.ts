/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModuleBase } from '@api/common/module.base';
import {
  IOrganizeService,
  SymbolOrganizeService,
} from '@application/interfaces/Organize.service.interface';

export class OrganizeModule extends ModuleBase {
  endpoint = '/organize';

  configureRoutes() {
    this.get<IOrganizeService, any>(
      SymbolOrganizeService,
      'test',
      (service, request) => {
        // throw Error('Not implemented');
        return `HELLO WORD ${new Date().toJSON()}`;
      },
      false,
    );

    this.post<IOrganizeService, any>(
      SymbolOrganizeService,
      'sort',
      (service, request) => service.sort(request),
      false,
    );
  }
}
