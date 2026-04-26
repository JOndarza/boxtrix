import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import CameraControls from 'camera-controls';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { ViewportGizmo } from 'three-viewport-gizmo';

/**
 * Owns the WebGL lifecycle scoped to a single CanvasComponent instance.
 * Provided in CanvasComponent's `providers` array so Angular disposes it
 * (and calls ngOnDestroy) when the component is destroyed.
 */
@Injectable()
export class SceneService implements OnDestroy {
  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _controls!: CameraControls;
  private _mainGroup!: THREE.Object3D;
  private _frameId!: number;
  private _dirty = false;
  private readonly _clock = new THREE.Clock();
  private readonly _raycaster = new THREE.Raycaster();
  private _viewportGizmo!: ViewportGizmo;

  // ── Post-processing ───────────────────────────────────────────────────────
  private _composer!: EffectComposer;
  private _outlineSelected!: OutlinePass;
  private _outlineHover!: OutlinePass;
  private _gtaoPass!: GTAOPass;
  private _bloomPass!: UnrealBloomPass;
  private _smaaPass!: SMAAPass;

  // ── Gizmos ────────────────────────────────────────────────────────────────
  // ViewportGizmo reads controls.target (OrbitControls API) but CameraControls
  // exposes getTarget() instead. This buffer is shimmed as a getter so the
  // gizmo gets a live Vector3 and the crash on _onPointerDown is avoided.
  private readonly _gizmoTarget = new THREE.Vector3();
  private _transform!: TransformControls;
  private _stats!: Stats;
  private _clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  private _planeHelper!: THREE.PlaneHelper;

  /** Called every animation frame after the main render (e.g. CSS2DRenderer). */
  afterRender: (() => void) | null = null;

  /** Called every animation frame with delta time (e.g. FlyControls.update). Always marks dirty. */
  onFrame: ((delta: number) => void) | null = null;

  get scene(): THREE.Scene { return this._scene; }
  get camera(): THREE.PerspectiveCamera { return this._camera; }
  get cameraControls(): CameraControls { return this._controls; }
  get mainGroup(): THREE.Object3D { return this._mainGroup; }
  get renderer(): THREE.WebGLRenderer { return this._renderer; }

  init(canvas: HTMLElement): void {
    CameraControls.install({ THREE: THREE as Parameters<typeof CameraControls.install>[0]['THREE'] });

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

    this._camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 100000);
    this._camera.position.set(-50, 50, -50);

    this._controls = new CameraControls(this._camera, this._renderer.domElement);
    this._controls.dampingFactor = 0.1;
    this._controls.draggingDampingFactor = 0.25;

    this._viewportGizmo = new ViewportGizmo(this._camera, this._renderer, {
      placement: 'top-right',
      size: 96,
      offset: { top: 90 },
    });
    this._viewportGizmo.attachControls(this._controls as unknown as OrbitControls);
    // CameraControls dispatches 'update' instead of the 'change' OrbitControls API
    // that ViewportGizmo expects. Bridge the gap so the gizmo tracks the camera.
    // Also fix gizmo.target: CameraControls has no .target property (uses getTarget()),
    // so attachControls leaves it undefined — point it at _gizmoTarget so _onPointerDown
    // never crashes and the animate loop keeps it in sync via getTarget().
    this._controls.getTarget(this._gizmoTarget);
    this._viewportGizmo.target = this._gizmoTarget;
    this._controls.addEventListener('update', () => this._viewportGizmo.update(false));

    // ── EffectComposer pass chain ─────────────────────────────────────────
    // Bloom before outlines so outline edges stay crisp.
    this._composer = new EffectComposer(this._renderer);
    this._composer.addPass(new RenderPass(this._scene, this._camera));

    this._gtaoPass = new GTAOPass(this._scene, this._camera, width, height);
    this._gtaoPass.enabled = false;
    this._composer.addPass(this._gtaoPass);

    this._bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.4, 0.3, 0.85);
    this._bloomPass.enabled = false;
    this._composer.addPass(this._bloomPass);

    this._outlineSelected = new OutlinePass(
      new THREE.Vector2(width, height), this._scene, this._camera,
    );
    this._outlineSelected.visibleEdgeColor.set(0xffffff);
    this._outlineSelected.hiddenEdgeColor.set(0x444444);
    this._outlineSelected.edgeStrength = 3;
    this._outlineSelected.edgeThickness = 1;
    this._composer.addPass(this._outlineSelected);

    this._outlineHover = new OutlinePass(
      new THREE.Vector2(width, height), this._scene, this._camera,
    );
    this._outlineHover.visibleEdgeColor.set(0x888888);
    this._outlineHover.edgeStrength = 2;
    this._outlineHover.edgeThickness = 1;
    this._composer.addPass(this._outlineHover);

    this._smaaPass = new SMAAPass();
    this._composer.addPass(this._smaaPass);

    // ── TransformControls ─────────────────────────────────────────────────
    this._transform = new TransformControls(this._camera, this._renderer.domElement);
    this._transform.addEventListener('dragging-changed', (e) => {
      this._controls.enabled = !(e as unknown as { value: boolean }).value;
      this._dirty = true;
    });
    this._transform.addEventListener('change', () => { this._dirty = true; });
    this._scene.add(this._transform.getHelper());

    // ── Clipping plane ────────────────────────────────────────────────────
    this._planeHelper = new THREE.PlaneHelper(this._clippingPlane, 200, 0x888888);
    this._planeHelper.visible = false;
    this._scene.add(this._planeHelper);

    // ── Stats ─────────────────────────────────────────────────────────────
    this._stats = new Stats();
    this._stats.dom.style.display = 'none';
    canvas.appendChild(this._stats.dom);

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
    this._composer.setSize(width, height);
    this._viewportGizmo.update();
    this.markDirty();
  }

  /** Clears the scene and returns a fresh empty group as the new main group. */
  resetMainGroup(): THREE.Object3D {
    this._scene.clear();
    this._scene.add(this._transform.getHelper());
    this._scene.add(this._planeHelper);
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

  // ── Camera helpers ────────────────────────────────────────────────────────
  animateTo(pos: THREE.Vector3, target: THREE.Vector3): void {
    this._controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);
    this.markDirty();
  }

  setCamera(pos: THREE.Vector3, target: THREE.Vector3): void {
    this._controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, false);
    this.markDirty();
  }

  fitToBox(box: THREE.Box3): void {
    this._controls.fitToBox(box, true, { paddingLeft: 0.2, paddingRight: 0.2, paddingTop: 0.2, paddingBottom: 0.2 });
    this.markDirty();
  }

  saveCameraState(): void { this._controls.saveState(); }

  /** Re-sync CameraControls internal state to match the camera's current world transform.
   *  Call after any external tool (e.g. FlyControls) has moved the camera directly. */
  syncCameraState(): void {
    const pos = this._camera.position;
    const forward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(this._camera.quaternion);
    const target = pos.clone().addScaledVector(forward, 50);
    this._controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, false);
  }

  resetCamera(): void {
    this._controls.reset(true);
    this.markDirty();
  }

  getTarget(out: THREE.Vector3): THREE.Vector3 { return this._controls.getTarget(out); }

  // ── Outline ───────────────────────────────────────────────────────────────
  setOutlineSelected(objs: THREE.Object3D[]): void {
    this._outlineSelected.selectedObjects = objs;
    this.markDirty();
  }

  setOutlineHover(objs: THREE.Object3D[]): void {
    this._outlineHover.selectedObjects = objs;
    this.markDirty();
  }

  // ── TransformControls ─────────────────────────────────────────────────────
  attachTransform(obj: THREE.Object3D): void {
    this._transform.attach(obj);
    this.markDirty();
  }

  detachTransform(): void {
    this._transform.detach();
    this.markDirty();
  }

  setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this._transform.setMode(mode);
    this.markDirty();
  }

  // ── Post-processing toggles ───────────────────────────────────────────────
  setAOEnabled(v: boolean): void {
    this._gtaoPass.enabled = v;
    this.markDirty();
  }

  setBloomEnabled(v: boolean): void {
    this._bloomPass.enabled = v;
    this.markDirty();
  }

  // ── Clipping plane ────────────────────────────────────────────────────────
  setClippingEnabled(v: boolean): void {
    this._renderer.clippingPlanes = v ? [this._clippingPlane] : [];
    this._planeHelper.visible = v;
    this.markDirty();
  }

  setClippingY(y: number): void {
    this._clippingPlane.constant = y;
    this.markDirty();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  setStatsVisible(visible: boolean): void {
    this._stats.dom.style.display = visible ? 'block' : 'none';
  }

  // ── Screenshot ────────────────────────────────────────────────────────────
  takeScreenshot(): void {
    this._composer.render();
    const url = this._renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boxtrix-snapshot.png';
    a.click();
  }

  // ── Raycasting ────────────────────────────────────────────────────────────
  intersect(group: THREE.Object3D, pointer: THREE.Vector2): THREE.Intersection[] {
    this._raycaster.setFromCamera(pointer, this._camera);
    return this._raycaster.intersectObject(group, true);
  }

  markDirty(): void { this._dirty = true; }

  ngOnDestroy(): void {
    cancelAnimationFrame(this._frameId);
    this._stats.dom.remove();
    this._viewportGizmo.dispose();
    this._controls.dispose();
    this._transform.dispose();
    this._composer.dispose();
    this._renderer.dispose();
    this._renderer.forceContextLoss();
    this._scene.clear();
  }

  private _animate = (): void => {
    const delta = this._clock.getDelta();
    const cameraChanged = this._controls.update(delta);
    if (cameraChanged) {
      this._dirty = true;
      this._controls.getTarget(this._gizmoTarget);
    }
    if (this.onFrame) {
      this.onFrame(delta);
      this._dirty = true;
    }
    this._stats.update();
    if (this._dirty) {
      this._composer.render();
      this._dirty = false;
    }
    this.afterRender?.();
    this._viewportGizmo.render();
    this._frameId = requestAnimationFrame(this._animate);
  };
}
