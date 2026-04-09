import 'reflect-metadata';

import { IAIService } from '@domain/interfaces/AI.service.interface';
import { inject, injectable } from 'inversify';
import {
  IHTTPService,
  SymbolHTTPService,
} from '@domain/interfaces/HTTP.service.interface';

@injectable()
export class AIService implements IAIService {
  constructor(@inject(SymbolHTTPService) private _http: IHTTPService) {}
}
