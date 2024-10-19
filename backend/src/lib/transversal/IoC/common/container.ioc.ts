/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from 'inversify';

export class IocContainer {
  private _container = new Container();

  public add<T>(type: new (...args: Array<any>) => T, id: symbol) {
    this._container.bind<T>(id).to(type).inSingletonScope();
  }

  public get<T>(id: symbol): T {
    return this._container.get<T>(id);
  }
}
