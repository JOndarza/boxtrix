import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ViewportGizmo } from 'three-viewport-gizmo';

/**
 * Owns the WebGL lifecycle scoped to a single CanvasComponent instance.
 * Provided in CanvasComponent's `providers` array so Angular disposes it
 * (and calls ngOnDestroy) when the component is destroyed.
 *
 * C3 — full teardown on destroy
 * C4 — dirty-flag render: only re-renders when markDirty() is called or
 *       controls emit 'change' (covers damping settle frames automatically).
 */
@Injectable()
export class SceneService implements OnDestroy {
  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _controls!: OrbitControls;
  private _mainGroup!: THREE.Object3D;
  private _frameId!: number;
  private _dirty = false;
  private readonly _raycaster = new THREE.Raycaster();
  private _viewportGizmo!: ViewportGizmo;

  get scene(): THREE.Scene {
    return this._scene;
  }
  get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }
  get controls(): OrbitControls {
    return this._controls;
  }
  get mainGroup(): THREE.Object3D {
    return this._mainGroup;
  }

  init(canvas: HTMLElement): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(width, height);
    canvas.appendChild(this._renderer.domElement);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color('#000');

    this._camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 10000);
    this._camera.position.set(-50, 50, -50);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.25;
    this._controls.enableZoom = true;
    this._controls.autoRotate = false;
    this._controls.addEventListener('change', this._onControlsChange);

    this._viewportGizmo = new ViewportGizmo(this._camera, this._renderer, {
      placement: 'top-right',
      size: 96,
      offset: { top: 90 },
    });
    this._viewportGizmo.attachControls(this._controls);

    this._mainGroup = new THREE.Object3D();
    this._scene.add(this._mainGroup);

    this._frameId = requestAnimationFrame(this._animate);
  }

  onResize(canvas: HTMLElement): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height);
    this._viewportGizmo.update();
    this.markDirty();
  }

  /** Clears the scene and returns a fresh empty group as the new main group. */
  resetMainGroup(): THREE.Object3D {
    this._scene.clear();
    this._mainGroup = new THREE.Object3D();
    this._scene.add(this._mainGroup);
    return this._mainGroup;
  }

  addToScene(...objects: THREE.Object3D[]): void {
    objects.forEach((o) => this._scene.add(o));
  }

  setBackground(color: string): void {
    (this._scene.background as THREE.Color).set(color);
  }

  setPixelRatio(ratio: number): void {
    this._renderer.setPixelRatio(ratio);
    this.markDirty();
  }

  setToneMapping(mode: THREE.ToneMapping): void {
    this._renderer.toneMapping = mode;
    this.markDirty();
  }

  intersect(group: THREE.Object3D, pointer: THREE.Vector2): THREE.Intersection[] {
    this._raycaster.setFromCamera(pointer, this._camera);
    return this._raycaster.intersectObject(group, true);
  }

  markDirty(): void {
    this._dirty = true;
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this._frameId);
    this._viewportGizmo.dispose();
    this._controls.removeEventListener('change', this._onControlsChange);
    this._controls.dispose();
    this._renderer.dispose();
    this._renderer.forceContextLoss();
    this._scene.clear();
  }

  private _onControlsChange = (): void => {
    this._dirty = true;
  };

  // controls.update() must run every frame to process damping; it fires
  // 'change' during settle, which sets _dirty — so renders stop automatically.
  private _animate = (): void => {
    this._controls.update();
    if (this._dirty) {
      this._renderer.render(this._scene, this._camera);
      this._dirty = false;
    }
    this._viewportGizmo.render();
    this._frameId = requestAnimationFrame(this._animate);
  };
}
