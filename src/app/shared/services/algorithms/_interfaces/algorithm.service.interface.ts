import { BoxTrixContainer } from '@common/classes/rendered/Container.class';
import { IStage } from '@common/interfaces/Input.interface';

export interface IAlgorithmService {
  sort(input: IStage): BoxTrixContainer;
}
