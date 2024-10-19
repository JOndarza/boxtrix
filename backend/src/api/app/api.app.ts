import { APIBase } from '@api/common/api.base';
import 'reflect-metadata';

export class APIApp extends APIBase {
  constructor() {
    super();
  }

  configureRoutes() {}

  async afterInit(): Promise<void> {
    console.info('API ready.');
  }
}
