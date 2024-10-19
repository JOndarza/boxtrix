import { IOutput } from '@domain/interfaces/structures/Output.interface';

import { IInput } from '../../domain/interfaces/structures/Input.interface';

export const SymbolOrganizeService = Symbol.for('IOrganizeService');

export interface IOrganizeService {
  sort(input: IInput): IOutput;
}
