import 'reflect-metadata';

import { IOrganizeService } from '@application/interfaces/Organize.service.interface';
import {
  IOrganizeAlgorithmService,
  SymbolBINPACKINGJSService,
} from '@domain/interfaces/OrganizeAlgorithm.service.interface';
import { IInput } from '@domain/interfaces/structures/Input.interface';
import { IOutput } from '@domain/interfaces/structures/Output.interface';
import { inject, injectable } from 'inversify';

@injectable()
export class OrganizeService implements IOrganizeService {
  constructor(
    @inject(SymbolBINPACKINGJSService)
    private _algorithmLocal: IOrganizeAlgorithmService,
  ) {}

  sort(input: IInput): IOutput {
    return this._algorithmLocal.sort(input);
  }
}
