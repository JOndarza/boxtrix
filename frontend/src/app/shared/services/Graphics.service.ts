import { Injectable, signal } from '@angular/core';
import * as THREE from 'three';

export type PixelRatioPreset = 'performance' | 'balanced' | 'high' | 'native';

export interface IGraphicsSettings {
  pixelRatioPreset: PixelRatioPreset;
  toneMapping: THREE.ToneMapping;
  ambientIntensity: number;
}

export const PIXEL_RATIO_VALUES: Record<PixelRatioPreset, () => number> = {
  performance: () => 0.75,
  balanced:    () => 1,
  high:        () => 1.5,
  native:      () => window.devicePixelRatio,
};

const KEY = 'boxtrix-graphics';

const DEFAULTS: IGraphicsSettings = {
  pixelRatioPreset: 'high',
  toneMapping: THREE.NoToneMapping,
  ambientIntensity: 0.6,
};

@Injectable({ providedIn: 'root' })
export class GraphicsService {
  private readonly _settings = signal<IGraphicsSettings>(this._load());

  readonly isPanelOpen = signal(false);
  readonly settings = this._settings.asReadonly();

  togglePanel(): void {
    this.isPanelOpen.update(v => !v);
  }

  setPixelRatioPreset(p: PixelRatioPreset): void {
    this._settings.update(s => ({ ...s, pixelRatioPreset: p }));
    this._persist();
  }

  setToneMapping(m: THREE.ToneMapping): void {
    this._settings.update(s => ({ ...s, toneMapping: m }));
    this._persist();
  }

  setAmbientIntensity(v: number): void {
    this._settings.update(s => ({ ...s, ambientIntensity: Math.min(2, Math.max(0.1, v)) }));
    this._persist();
  }

  private _load(): IGraphicsSettings {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      const p = JSON.parse(raw) as Partial<IGraphicsSettings>;
      return {
        pixelRatioPreset: p.pixelRatioPreset ?? DEFAULTS.pixelRatioPreset,
        toneMapping: p.toneMapping ?? DEFAULTS.toneMapping,
        ambientIntensity: p.ambientIntensity ?? DEFAULTS.ambientIntensity,
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private _persist(): void {
    localStorage.setItem(KEY, JSON.stringify(this._settings()));
  }
}
