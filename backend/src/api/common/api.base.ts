import { getVar } from '@environment/vars';
import compress from 'compression';
import cors, { CorsOptions } from 'cors';
import errorHandler from 'errorhandler';
import express, { Application, Router } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { ModuleBase } from './module.base';

const portText = 'port';

export abstract class APIBase {
  get port(): number {
    return this._core.get(portText);
  }

  protected _core!: Application;
  protected _router!: Router;

  protected!: Router;

  config() {
    this._core = express();

    this.settings();
    this.setMiddlewares();
    this.configureRoutes();
  }

  async listen() {
    await this._core.listen(this.port, () =>
      console.info(`Server online on port ${this.port}.`),
    );

    await this.afterInit();
  }

  abstract configureRoutes(): void;
  abstract afterInit(): Promise<void>;

  protected settings() {
    this._core.set(portText, process.env.PORT || 4200);
  }

  protected setMiddlewares() {
    this._core.use(express.json());
    this._core.use(express.urlencoded({ extended: false }));

    this._core.use(helmet.xssFilter());
    this._core.use(helmet.noSniff());
    this._core.use(helmet.hidePoweredBy());
    this._core.use(helmet.frameguard({ action: 'deny' }));
    this._core.use(compress());
    this._core.use(morgan('dev'));

    const allowedOrigins = [getVar('FRONTEND_ORIGIN')];
    const corsOptions = {
      origin: (origin, callback) => {
        console.log('origin', origin);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    } as CorsOptions;

    this._core.use(cors(corsOptions));

    this._router = Router();
    this._router.use(errorHandler());
    this._core.use(this._router);
  }

  protected createModule<T extends ModuleBase>(type: new () => T) {
    const module = new type();
    module.setRouter(this._router);
    module.configureRoutes();
  }
}
