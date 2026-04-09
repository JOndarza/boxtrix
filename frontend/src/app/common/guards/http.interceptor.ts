import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommunicationService } from '@common/services/communication.service';

@Injectable()
export class CustomHttpInterceptor implements HttpInterceptor {
  constructor(private _comunication: CommunicationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const headers: any = {};

    const auth = this._comunication.auth;
    if (auth) headers[this._comunication.ID_SESSION] = auth;

    const clone = req.clone({
      setHeaders: headers,
      url: [this._comunication.api, req.url].join('/'),
    });

    return next.handle(clone);
  }
}
