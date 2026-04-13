import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CommunicationService } from '@common/services/communication.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const communication = inject(CommunicationService);
  const headers: Record<string, string> = {};

  const auth = communication.auth;
  if (auth) headers[communication.ID_SESSION] = auth;

  const clone = req.clone({
    setHeaders: headers,
    url: [communication.api, req.url].join('/'),
  });

  return next(clone);
};
