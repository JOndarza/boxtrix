import { Project } from '@common/classes/rendered/Project.class';
import { IProjectInput } from '@common/interfaces/Input.interface';

export interface IAlgorithmService {
  sort(input: IProjectInput): Project;
}
