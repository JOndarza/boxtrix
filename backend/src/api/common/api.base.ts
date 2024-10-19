import { getVar } from '@environment/vars';
import cors, { CorsOptions } from 'cors';
import express, { Application, Router } from 'express';
import morgan from 'morgan';

const portText = 'port';

export abstract class APIBase {
  get port(): number {
    return this._core.get(portText);
  }

  protected _core!: Application;
  protected _router = Router();

  config() {
    this._core = express();
    this._router = Router();
    this.configure();
  }

  async listen() {
    await this._core.listen(this.port, () =>
      console.info(`Server online on port ${this.port}.`),
    );

    await this.afterInit();
  }

  abstract configureRoutes(): void;
  abstract afterInit(): Promise<void>;

  protected configure() {
    this.setMiddlewares();
    this.settings();
    this.configureRoutes();
  }

  protected settings() {
    this._core.set(portText, process.env.PORT || 4200);
  }

  protected setMiddlewares() {
    this._core.use(express.json());
    this._core.use(express.urlencoded({ extended: false }));

    // Server log
    this._core.use(morgan('dev'));

    // CORS
    const corsHeaders = {
      origin: getVar('FRONTEND_ORIGIN'),
      methods: 'GET,POST',
      credentials: true,
    } as CorsOptions;

    this._core.use(cors(corsHeaders));

    this._core.use(this._router);
  }
}
