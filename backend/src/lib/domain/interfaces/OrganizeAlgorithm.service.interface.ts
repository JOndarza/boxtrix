import { IInput } from './structures/Input.interface';
import { IOutput } from './structures/Output.interface';

export const SymbolBINPACKINGJSService = Symbol.for('IBINPACKINGJSService');
export const SymbolOpenAIService = Symbol.for('IOpenAIService');

export interface IOrganizeAlgorithmService {
  sort(input: IInput): IOutput;
}
