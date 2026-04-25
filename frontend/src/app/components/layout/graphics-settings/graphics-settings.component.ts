import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import * as THREE from 'three';
import {
  GraphicsService,
  PixelRatioPreset,
} from '@shared/services/Graphics.service';

interface IPresetOption {
  value: PixelRatioPreset;
  label: string;
}

interface IToneMappingOption {
  value: THREE.ToneMapping;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-graphics-settings',
  templateUrl: './graphics-settings.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphicsSettingsComponent {
  private readonly _graphics = inject(GraphicsService);

  readonly isPanelOpen     = this._graphics.isPanelOpen;
  readonly settings        = this._graphics.settings;
  readonly showStats       = this._graphics.showStats;
  readonly clippingEnabled = this._graphics.clippingEnabled;
  readonly clippingY       = this._graphics.clippingY;

  readonly presetOptions: IPresetOption[] = [
    { value: 'performance', label: 'Rendimiento' },
    { value: 'balanced',    label: 'Balanceado' },
    { value: 'high',        label: 'Alto' },
    { value: 'native',      label: `Nativo (${window.devicePixelRatio}×)` },
  ];

  readonly toneMappingOptions: IToneMappingOption[] = [
    { value: THREE.NoToneMapping,         label: 'Ninguno' },
    { value: THREE.LinearToneMapping,     label: 'Lineal' },
    { value: THREE.ReinhardToneMapping,   label: 'Reinhard' },
    { value: THREE.ACESFilmicToneMapping, label: 'ACES Filmic' },
    { value: THREE.AgXToneMapping,        label: 'AgX' },
  ];

  @HostListener('document:keydown.escape')
  close(): void { this._graphics.isPanelOpen.set(false); }

  selectPreset(preset: PixelRatioPreset): void { this._graphics.setPixelRatioPreset(preset); }

  selectToneMapping(event: Event): void {
    this._graphics.setToneMapping(+(event.target as HTMLSelectElement).value as THREE.ToneMapping);
  }

  onIntensityInput(event: Event): void {
    this._graphics.setAmbientIntensity(+(event.target as HTMLInputElement).value);
  }

  onClippingYInput(event: Event): void {
    this._graphics.setClippingY(+(event.target as HTMLInputElement).value);
  }

  formatIntensity(v: number): string { return v.toFixed(1); }

  toggleStats(): void    { this._graphics.toggleStats(); }
  toggleAO(): void       { this._graphics.toggleAO(); }
  toggleBloom(): void    { this._graphics.toggleBloom(); }
  toggleClipping(): void { this._graphics.toggleClipping(); }
}
