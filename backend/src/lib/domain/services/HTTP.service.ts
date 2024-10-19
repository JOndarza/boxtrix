import 'reflect-metadata';

import { injectable } from 'inversify';
import { IHTTPService } from '@domain/interfaces/HTTP.service.interface';

@injectable()
export class HTTPService implements IHTTPService {}
