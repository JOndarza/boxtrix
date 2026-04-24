import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  set(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  get(key: string) {
    let a: string | null = null;
    try {
      a = localStorage.getItem(key) || '';
    } catch {}

    return a;
  }

  delete(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}
