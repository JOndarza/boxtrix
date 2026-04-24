import { Injectable, signal } from '@angular/core';

const KEY = 'boxtrix-theme';

function initDark(): boolean {
  const saved = localStorage.getItem(KEY);
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(initDark());

  constructor() {
    this._apply();
  }

  toggle(): void {
    this.isDark.update((v) => !v);
    localStorage.setItem(KEY, this.isDark() ? 'dark' : 'light');
    this._apply();
  }

  private _apply(): void {
    document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
  }
}
