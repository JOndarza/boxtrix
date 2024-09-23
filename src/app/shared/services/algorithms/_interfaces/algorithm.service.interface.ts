import { BoxTrixContainer } from '@common/classes/news/Container.class';
import { IStage } from '@common/interfaces/Input.interface';

export interface IAlgorithmService {
  sort(input: IStage): BoxTrixContainer;
}
