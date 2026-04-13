import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

/**
 * M4 — Abstract base for all API services.
 *
 * Subclasses must be decorated with @Injectable({ providedIn: 'root' }).
 * Angular resolves HttpClient automatically via the base-class inject() call;
 * subclass constructors do not need to declare or forward it.
 *
 * Usage:
 *   @Injectable({ providedIn: 'root' })
 *   export class MyService extends ApiServiceBase {
 *     override endpoint = 'my-resource';
 *   }
 */
@Injectable()
export abstract class ApiServiceBase {
  abstract endpoint: string;

  private readonly _http = inject(HttpClient);

  get<TResponse>(method: string) {
    return this._http.get<TResponse>(this.getUrl(method));
  }

  post<TResponse, TBody>(method: string, body: TBody) {
    return this._http.post<TResponse>(this.getUrl(method), body);
  }

  protected getUrl(method: string) {
    return `${this.endpoint}/${method}`;
  }
}
