import { BoxTrixContainer } from '@common/classes/news/Container.class';
import { IInput } from '@common/interfaces/Input.interface';

export interface IAlgorithmService {
  sort(input: IInput): BoxTrixContainer[];
}
