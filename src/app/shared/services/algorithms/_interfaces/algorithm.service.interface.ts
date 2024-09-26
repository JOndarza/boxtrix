import { BoxTrixContainer } from '@common/classes/rendered/Container.class';
import { Project } from '@common/classes/rendered/Project.class';
import { IProjectInput, IStage } from '@common/interfaces/Input.interface';

export interface IAlgorithmService {
  sort(input: IStage): BoxTrixContainer;
}

export interface IAlgorithmServiceV2 {
  sort(input: IProjectInput): Project;
}
