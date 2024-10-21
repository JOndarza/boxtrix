import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface IRequesConfig {}

export interface IApiResponse<TResponse> {
  data: TResponse;
  message: string;
  success: boolean;
}

@Injectable()
export abstract class ApiServiceBase {
  abstract endpoint: string;

  constructor(private _http: HttpClient) {}

  get<TResponse>(method: string, config?: IRequesConfig) {
    return this._http.get<TResponse>(this.getUrl(method));
  }

  post<TResponse, TBody>(method: string, body: TBody, config?: IRequesConfig) {
    return this._http.post<TResponse>(this.getUrl(method), body);
  }

  protected getUrl(method: string) {
    return `${this.endpoint}/${method}`;
  }
}
