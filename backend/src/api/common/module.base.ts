/* eslint-disable @typescript-eslint/no-explicit-any */
import { getVar } from '@environment/vars';
import IoC from '@transversal/IoC/manager.ioc';
import { Application, NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

const sessionJWTProp = 'session';
const _secret = getVar('SERVER_JWT_PASS') || 'JWT';

export interface IAPIRequestData {
  request: Request;
  response: Response;
}

interface IJWTStruct {
  idSession: string;
  ip: string;
}

export function authenticateJWT(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authorization = request.headers?.authorization;
    if (!authorization) throw Error('Authorization header not found.');

    const session = jwt.verify(authorization, _secret) as IJWTStruct;
    // if (session.ip !== getRequestIP(request)) throw Error('IPs dont match.');

    // Set session on the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any)[sessionJWTProp] = session;
    next();
  } catch {
    throw Error('Authorization header not found.');
  }
}

export function getSession(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (request as any)[sessionJWTProp] as IJWTStruct;
}

export abstract class ModuleBase {
  abstract endpoint: string;

  private _core!: Application;

  setCore(core: Application) {
    this._core = core;
  }

  abstract configureRoutes(): void;

  public get<TService = any, TResponse = any>(
    idIoC: symbol,
    method: string,
    event: (
      service: TService,
      api: IAPIRequestData,
    ) => TResponse | Promise<TResponse>,
    checkJWT = true,
  ) {
    const logicGET = async (request: Request, response: Response) => {
      let data = undefined;

      try {
        const service = checkJWT
          ? await this.getService<TService>({ request, idIOC: idIoC })
          : IoC.get<TService>(idIoC);

        data = await event(service, {
          request,
          response,
        });
      } catch (error) {
        console.error(error);
      }

      response.json(data);

      return;
    };

    if (checkJWT)
      this._core.get(this.getPath(method), authenticateJWT, logicGET);
    else this._core.get(this.getPath(method), logicGET);
  }

  public post<TService, TRequest, TResponse = any>(
    idIOC: symbol,
    method: string,
    event: (
      service: TService,
      request: TRequest,
      api: IAPIRequestData,
    ) => TResponse | Promise<TResponse>,
    checkJWT = true,
  ) {
    const logicPOST = async (request: Request, response: Response) => {
      let data = undefined;

      try {
        const service = checkJWT
          ? await this.getService<TService>({ request, idIOC })
          : IoC.get<TService>(idIOC);

        const body = request.body as TRequest;
        data = await event(service, body, {
          request,
          response,
        });
      } catch (error) {
        console.error(error);
      }
      response.json(data);

      return;
    };

    if (checkJWT) {
      this._core.post(this.getPath(method), authenticateJWT, logicPOST);
    } else this._core.post(this.getPath(method), logicPOST);
  }

  private getPath(method: string): string {
    return `${this.endpoint}/${method}`;
  }

  private async getService<TService>(data: {
    request: Request;
    idIOC: symbol;
  }) {
    const service = IoC.get<TService>(data.idIOC);

    return service;
  }
}
