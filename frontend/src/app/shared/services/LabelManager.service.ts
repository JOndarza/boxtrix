import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';

/**
 * Owns a CSS2DRenderer overlay for HTML box labels.
 * Provided in CanvasComponent providers so it shares the component lifetime.
 */
@Injectable()
export class LabelManagerService implements OnDestroy {
  private _renderer!: CSS2DRenderer;
  private _labels: CSS2DObject[] = [];
  private _visible = false;

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

    const div = document.createElement('div');
    div.className = 'scene-label';
    div.textContent = data.name;
    div.style.display = this._visible ? '' : 'none';

    const label = new CSS2DObject(div);
    label.position.set(0, 0, 0);
    obj.add(label);
    this._labels.push(label);
  }

  clearLabels(): void {
    this._labels.forEach(l => {
      (l.element as HTMLElement).remove();
      l.removeFromParent();
    });
    this._labels = [];
  }

  setVisible(v: boolean): void {
    this._visible = v;
    this._labels.forEach(l => {
      (l.element as HTMLElement).style.display = v ? '' : 'none';
    });
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this._renderer?.render(scene, camera);
  }

  ngOnDestroy(): void {
    this.clearLabels();
    this._renderer?.domElement.remove();
  }
}
