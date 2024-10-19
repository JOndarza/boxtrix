import {
  IOrganizeService,
  SymbolOrganizeService,
} from '@application/interfaces/Organize.service.interface';
import { OrganizeService } from '@application/services/Organize.service';

import IoC from '../manager.ioc';

export function init() {
  IoC.add<IOrganizeService>(OrganizeService, SymbolOrganizeService);
}
