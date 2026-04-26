import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';

interface LabelEntry {
  label: CSS2DObject;
  globalStep: number;
}

/**
 * Owns a CSS2DRenderer overlay for HTML box labels.
 * Provided in CanvasComponent providers so it shares the component lifetime.
 */
@Injectable()
export class LabelManagerService implements OnDestroy {
  private _renderer!: CSS2DRenderer;
  private _labels: LabelEntry[] = [];

  init(canvas: HTMLElement): void {
    this._renderer = new CSS2DRenderer();
    this._renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this._renderer.domElement.style.position = 'absolute';
    this._renderer.domElement.style.top = '0';
    this._renderer.domElement.style.left = '0';
    this._renderer.domElement.style.pointerEvents = 'none';
    canvas.appendChild(this._renderer.domElement);
  }

  onResize(canvas: HTMLElement): void {
    this._renderer?.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  addLabel(obj: THREE.Object3D): void {
    const data = obj.userData as RenderedController;
    if (!data?.name) return;

    const color = typeof data.color === 'number'
      ? '#' + data.color.toString(16).padStart(6, '0')
      : String(data.color ?? '#888');

    const div = document.createElement('div');
    div.className = 'scene-label';

    const swatch = document.createElement('span');
    swatch.className = 'scene-label__swatch';
    swatch.style.background = color;

    const name = document.createElement('span');
    name.className = 'scene-label__name';
    name.textContent = data.name;

    div.appendChild(swatch);
    div.appendChild(name);

    const label = new CSS2DObject(div);
    label.position.set(0, 0, 0);
    label.visible = false;
    obj.add(label);
    this._labels.push({ label, globalStep: data.globalStep });
  }

  // Show the label whose globalStep matches currentStep; hide everything else.
  // At maxStep (all boxes placed) no label is shown.
  // Visibility is set via Three.js Object3D.visible so CSS2DRenderer respects it.
  updateStep(currentStep: number, maxStep: number): void {
    const atEnd = currentStep >= maxStep;
    this._labels.forEach(({ label, globalStep }) => {
      label.visible = !atEnd && globalStep > 0 && globalStep === currentStep;
    });
  }

  clearLabels(): void {
    this._labels.forEach(({ label }) => {
      (label.element as HTMLElement).remove();
      label.removeFromParent();
    });
    this._labels = [];
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this._renderer?.render(scene, camera);
  }

  ngOnDestroy(): void {
    this.clearLabels();
    this._renderer?.domElement.remove();
  }
}
