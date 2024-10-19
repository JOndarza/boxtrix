import { APIBase } from '@api/common/api.base';
import { OrganizeModule } from '@api/modules/Organize.module';
import 'reflect-metadata';

export class APIApp extends APIBase {
  constructor() {
    super();
  }

  configureRoutes() {
    this.createModule(OrganizeModule);
  }

  async afterInit(): Promise<void> {
    console.info('API ready.');
  }
}
