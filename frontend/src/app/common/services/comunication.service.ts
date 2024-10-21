import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ComunicationService {
  public readonly ID_SESSION = 'authorization';

  private _api?: string;
  public get api() {
    return this._api;
  }

  private _auth?: string;
  public get auth() {
    return this._auth;
  }

  constructor(private _storage: StorageService) {
    this._auth = this._storage.get(this.ID_SESSION) || undefined;
  }

  setOriginAPI(url_api?: string) {
    this._api = url_api;
  }

  setAuth(auth: string) {
    this._auth = auth;
    this._storage.set(this.ID_SESSION, auth);
  }

  clearAuth() {
    this._auth = undefined;
    this._storage.delete(this.ID_SESSION);
  }
}
