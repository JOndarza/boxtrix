import { Object3D } from 'three';

import { Container } from './Container.class';

export class ContainerControls {
  constructor(
    public parent: Object3D,
    public child: Object3D,
    public container: Container
  ) {}
}
