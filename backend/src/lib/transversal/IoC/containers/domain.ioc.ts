import {
  IAIService,
  SymbolAIService,
} from '@domain/interfaces/AI.service.interface';
import {
  IHTTPService,
  SymbolHTTPService,
} from '@domain/interfaces/HTTP.service.interface';
import {
  IOrganizeAlgorithmService,
  SymbolBINPACKINGJSService,
} from '@domain/interfaces/OrganizeAlgorithm.service.interface';
import { AIService } from '@domain/services/AI.service';
import { BINPACKINGJSService } from '@domain/services/algorithms/BINPACKINGJS/BINPACKINGJS.service';
import { HTTPService } from '@domain/services/HTTP.service';

import IoC from '../manager.ioc';

export function init() {
  IoC.add<IHTTPService>(HTTPService, SymbolHTTPService);
  IoC.add<IAIService>(AIService, SymbolAIService);

  // ALGORITHMS
  IoC.add<IOrganizeAlgorithmService>(
    BINPACKINGJSService,
    SymbolBINPACKINGJSService,
  );
}
