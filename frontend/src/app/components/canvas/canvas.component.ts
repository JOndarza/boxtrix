import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Area } from '@common/classes/rendered/Area.class';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { IMeasurements, IPosition } from '@common/dtos/Data.interface';
import { Rotation } from '@common/enums/Rotation.enum';
import { IScene } from '@common/interfaces/Scene.interface';
import { ConstantsService } from '@shared/services/Constants.service';
import { ContextService } from '@shared/services/Context.service';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { FocusManagerService } from '@shared/services/FocusManager.service';
import { InputPanelService } from '@shared/services/InputPanel.service';
import { KeyboardHelpService } from '@shared/services/KeyboardHelp.service';
import { RewindManagerService } from '@shared/services/RewindManager.service';
import { GraphicsService, PIXEL_RATIO_VALUES } from '@shared/services/Graphics.service';
import { SceneService } from '@shared/services/Scene.service';
import { TextManagerService } from '@shared/services/TextManager.service';
import { ThemeService } from '@shared/services/Theme.service';
import { debounceTime } from 'rxjs';
import * as THREE from 'three';
import { BoxGeometry } from 'three';
import { TextGeometryParameters } from 'three/examples/jsm/geometries/TextGeometry.js';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { Project } from '@common/classes/rendered/Project.class';
import { LabelManagerService } from '@shared/services/LabelManager.service';

export enum KeyCode {
  A = 65,
  D = 68,
  W = 87,
  S = 83,
}

@Component({
  standalone: true,
  selector: 'app-canvas',
  template: `
    <div #canvas class="canvas">
      @if (flyMode()) { <div class="fly-mode-badge">✈ FLY MODE — \` to exit</div> }
    </div>`,
  providers: [SceneService, LabelManagerService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLElement>;

  private readonly _constants = inject(ConstantsService);
  private readonly _events = inject(EventsService);
  private readonly _focus = inject(FocusManagerService);
  private readonly _rewind = inject(RewindManagerService);
  private readonly _text = inject(TextManagerService);
  private readonly _context = inject(ContextService);
  private readonly _sceneService = inject(SceneService);
  private readonly _theme = inject(ThemeService);
  private readonly _graphics = inject(GraphicsService);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _keyboardHelp = inject(KeyboardHelpService);
  private readonly _inputPanel   = inject(InputPanelService);
  private readonly _labels       = inject(LabelManagerService);

  private readonly _pointer = new THREE.Vector2();
  private _sceneReady = false;
  private _ambientLight!: THREE.AmbientLight;
  private _hoveredMesh: THREE.Mesh | null = null;

  private _grid: THREE.GridHelper | null = null;
  private _axes: THREE.AxesHelper | null = null;
  private _box3Helper: THREE.Box3Helper | null = null;
  private _dimensionArrows: THREE.ArrowHelper[] = [];
  private _areaHelpers: THREE.Box3Helper[] = [];
  private _helpersVisible = true;
  private _areaBoundsVisible = false;
  private _labelsVisible = false;

  // SelectionBox (Shift + drag)
  private _selectionBox!: SelectionBox;
  private _selectionHelper!: SelectionHelper;
  private _isMultiSelecting = false;

  // Fly mode
  readonly flyMode = signal(false);
  private _flyControls: FlyControls | null = null;

  // Reactively update background and rebuild scene geometry when theme toggles.
  private readonly _themeEffect = effect(() => {
    const dark = this._theme.isDark();
    if (!this._sceneReady) return;
    this._sceneService.setBackground(dark ? '#0a0b0d' : '#f0f1f3');
    // Rebuild if data is loaded so wireframe/grid colours update immediately.
    if (this._context.project) {
      this._events.get(AppEvent.RENDERING).next();
    } else {
      this._sceneService.markDirty();
    }
  });

  private readonly _pixelRatioEffect = effect(() => {
    const preset = this._graphics.settings().pixelRatioPreset;
    if (!this._sceneReady) return;
    this._sceneService.setPixelRatio(PIXEL_RATIO_VALUES[preset]());
  });

  private readonly _toneMappingEffect = effect(() => {
    const mode = this._graphics.settings().toneMapping;
    if (!this._sceneReady) return;
    this._sceneService.setToneMapping(mode);
  });

  private readonly _ambientEffect = effect(() => {
    const intensity = this._graphics.settings().ambientIntensity;
    if (!this._sceneReady || !this._ambientLight) return;
    this._ambientLight.intensity = intensity;
    this._sceneService.markDirty();
  });

  private readonly _statsEffect = effect(() => {
    const show = this._graphics.showStats();
    if (!this._sceneReady) return;
    this._sceneService.setStatsVisible(show);
  });

  private readonly _aoEffect = effect(() => {
    const on = this._graphics.settings().showAO;
    if (!this._sceneReady) return;
    this._sceneService.setAOEnabled(on);
  });

  private readonly _bloomEffect = effect(() => {
    const on = this._graphics.settings().showBloom;
    if (!this._sceneReady) return;
    this._sceneService.setBloomEnabled(on);
  });

  private readonly _clippingEffect = effect(() => {
    const on = this._graphics.clippingEnabled();
    if (!this._sceneReady) return;
    this._sceneService.setClippingEnabled(on);
  });

  private readonly _clippingYEffect = effect(() => {
    const y = this._graphics.clippingY();
    if (!this._sceneReady) return;
    this._sceneService.setClippingY(y);
  });

  // C2 — bound refs stored so removeEventListener can target the same function
  private readonly _onWindowResize = (): void => {
    this._sceneService.onResize(this.canvas.nativeElement);
    this._labels.onResize(this.canvas.nativeElement);
  };
  private readonly _onKeyDown = (e: KeyboardEvent): void => this.handleKeyDown(e);
  private readonly _onCanvasClick = (e: MouseEvent): void => this.handleCanvasClick(e);
  private readonly _onCanvasMouseMove = (e: MouseEvent): void => this.handleCanvasMouseMove(e);
  private readonly _onCanvasMouseLeave = (): void => this.clearHover();
  private readonly _onCanvasMouseDown = (e: MouseEvent): void => this.handleCanvasMouseDown(e);
  private readonly _onCanvasMouseUp = (e: MouseEvent): void => this.handleCanvasMouseUp(e);

  ngOnInit(): void {
    this._sceneService.init(this.canvas.nativeElement);
    this._sceneService.setBackground(this._theme.isDark() ? '#0a0b0d' : '#f0f1f3');
    this._sceneReady = true;
    const gfx = this._graphics.settings();
    this._sceneService.setPixelRatio(PIXEL_RATIO_VALUES[gfx.pixelRatioPreset]());
    this._sceneService.setToneMapping(gfx.toneMapping);

    // Labels CSS2D overlay
    this._labels.init(this.canvas.nativeElement);
    this._sceneService.afterRender = () =>
      this._labels.render(this._sceneService.scene, this._sceneService.camera);

    // SelectionBox for rubber-band multi-select (Shift + drag)
    this._selectionBox = new SelectionBox(this._sceneService.camera, this._sceneService.scene);
    this._selectionHelper = new SelectionHelper(this._sceneService.renderer, 'selectBox');
    this._selectionHelper.enabled = false;

    // C1 — takeUntilDestroyed prevents subscriptions from leaking past component lifetime
    this._events
      .get(AppEvent.RENDERING)
      .pipe(debounceTime(100), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.load());

    this._rewind.updated
      .pipe(debounceTime(50), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.handleStepNumber());

    this._events
      .get(AppEvent.CLICKED)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((id) => {
        const obj = this._sceneService.mainGroup.getObjectByProperty('uuid', id);
        if (obj) {
          this._focus.set(obj);
          this._sceneService.setOutlineSelected([obj]);
          this._sceneService.attachTransform(obj);
          this._updateBox3Helper(obj);
        }
      });

    this._events
      .get(AppEvent.SCREENSHOT)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._sceneService.takeScreenshot());

    window.addEventListener('resize', this._onWindowResize);
    document.addEventListener('keydown', this._onKeyDown);
    this.canvas.nativeElement.addEventListener('click', this._onCanvasClick);
    this.canvas.nativeElement.addEventListener('mousemove', this._onCanvasMouseMove);
    this.canvas.nativeElement.addEventListener('mouseleave', this._onCanvasMouseLeave);
    this.canvas.nativeElement.addEventListener('mousedown', this._onCanvasMouseDown);
    this.canvas.nativeElement.addEventListener('mouseup', this._onCanvasMouseUp);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this._onWindowResize);
    document.removeEventListener('keydown', this._onKeyDown);
    this.canvas.nativeElement.removeEventListener('click', this._onCanvasClick);
    this.canvas.nativeElement.removeEventListener('mousemove', this._onCanvasMouseMove);
    this.canvas.nativeElement.removeEventListener('mouseleave', this._onCanvasMouseLeave);
    this.canvas.nativeElement.removeEventListener('mousedown', this._onCanvasMouseDown);
    this.canvas.nativeElement.removeEventListener('mouseup', this._onCanvasMouseUp);
    this._sceneService.afterRender = null;
    this._sceneService.onFrame = null;
    if (this.flyMode()) this._exitFlyMode();
    this._selectionHelper?.dispose();
    // SceneService and LabelManagerService teardown handled by Angular's
    // component-scoped injector on destroy.
  }

  //#region Input handlers
  private handleKeyDown(event: KeyboardEvent): void {
    // Guard: don't steal keypresses when a text input has focus
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === '?') {
      this._keyboardHelp.toggle();
      return;
    }

    switch (event.code) {
      case 'Backquote': this._toggleFlyMode(); return;
      case 'KeyA': if (!this.flyMode()) this._rewind.back(); break;
      case 'KeyD': if (!this.flyMode()) this._rewind.forward(); break;
      case 'KeyF': this.focusSelected(); break;
      case 'KeyH': this.frameAll(); break;
      case 'KeyV': this.toggleHelpers(); break;
      case 'KeyG': this._sceneService.setTransformMode('translate'); break;
      case 'KeyR': this._sceneService.setTransformMode('rotate'); break;
      case 'KeyL': this.toggleLabels(); break;
      case 'KeyO': this.toggleAreaBounds(); break;
      case 'KeyC': this._graphics.toggleClipping(); break;
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'Escape':
        if (this.flyMode()) { this._exitFlyMode(); return; }
        this._sceneService.setOutlineSelected([]);
        this._sceneService.detachTransform();
        this._updateBox3Helper(null);
        this._focus.clear();
        this._keyboardHelp.close();
        this._inputPanel.close();
        break;
      default: {
        const n = parseInt(event.key, 10);
        if (n >= 1 && n <= 9) this.jumpToArea(n);
        break;
      }
    }
  }

  private handleCanvasMouseDown(event: MouseEvent): void {
    if (!event.shiftKey) return;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._selectionBox.startPoint.set(x, y, 0.5);
    this._selectionHelper.enabled = true;
    this._isMultiSelecting = true;
  }

  private handleCanvasMouseUp(event: MouseEvent): void {
    if (!this._isMultiSelecting) return;
    this._isMultiSelecting = false;
    this._selectionHelper.enabled = false;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._selectionBox.endPoint.set(x, y, 0.5);

    const picked = this._selectionBox.select().filter(
      (o) => (o.userData as RenderedController)?.targetable,
    );
    if (!picked.length) return;

    this._sceneService.setOutlineSelected(picked);
    if (picked.length === 1) {
      this._focus.set(picked[0]);
      this._sceneService.attachTransform(picked[0]);
      this._updateBox3Helper(picked[0]);
    } else {
      this._focus.clear();
      this._sceneService.detachTransform();
      this._updateBox3Helper(null);
    }
    this._sceneService.markDirty();
  }

  private handleCanvasClick(event: MouseEvent): void {
    if (this._isMultiSelecting || this.flyMode()) return;
    // M4 — use canvas bounding rect so coordinates are correct when the
    // sidebar overlaps part of the viewport
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const intersects = this._sceneService.intersect(this._sceneService.mainGroup, this._pointer);
    if (!intersects.length) return;

    const filter = intersects.filter(
      (x) => (x.object.userData as RenderedController)?.targetable,
    );
    if (!filter.length) return;

    const picked = filter[0].object;
    this._focus.set(picked);
    this._sceneService.setOutlineSelected([picked]);
    this._sceneService.attachTransform(picked);
    this._updateBox3Helper(picked);
  }

  private handleCanvasMouseMove(event: MouseEvent): void {
    if (this.flyMode()) return;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const intersects = this._sceneService.intersect(this._sceneService.mainGroup, this._pointer);
    const hit = intersects.find(
      (x) => (x.object.userData as RenderedController)?.targetable,
    )?.object as THREE.Mesh | undefined ?? null;

    if (hit === this._hoveredMesh) return;

    if (this._hoveredMesh) this._clearHoverEmissive(this._hoveredMesh);
    this._hoveredMesh = hit;
    if (hit) this._applyHoverEmissive(hit);
    this._sceneService.setOutlineHover(hit ? [hit] : []);
    this._sceneService.markDirty();
  }

  private clearHover(): void {
    if (!this._hoveredMesh) return;
    this._clearHoverEmissive(this._hoveredMesh);
    this._hoveredMesh = null;
    this._sceneService.setOutlineHover([]);
    this._sceneService.markDirty();
  }

  private focusSelected(): void {
    const obj = this._focus.obj3D;
    if (!obj) return;
    const box = new THREE.Box3().setFromObject(obj);
    this._sceneService.fitToBox(box);
  }

  private frameAll(): void {
    this._sceneService.resetCamera();
  }

  private jumpToArea(n: number): void {
    const areas = this._context.project?.areas.filter((a) => a.name !== 'UNFITTED');
    if (!areas?.length) return;
    const area = areas[n - 1];
    if (!area?.obj3D) return;
    const box = new THREE.Box3().setFromObject(area.obj3D as unknown as THREE.Object3D);
    this._sceneService.fitToBox(box);
  }

  private toggleHelpers(): void {
    this._helpersVisible = !this._helpersVisible;
    if (this._grid) this._grid.visible = this._helpersVisible;
    if (this._axes) this._axes.visible = this._helpersVisible;
    if (this._box3Helper) this._box3Helper.visible = this._helpersVisible;
    this._dimensionArrows.forEach(a => { a.visible = this._helpersVisible; });
    this._sceneService.markDirty();
  }

  private togglePlay(): void {
    this._rewind.togglePlay();
  }


  private toggleLabels(): void {
    this._labelsVisible = !this._labelsVisible;
    this._labels.setVisible(this._labelsVisible);
    this._sceneService.markDirty();
  }

  private toggleAreaBounds(): void {
    this._areaBoundsVisible = !this._areaBoundsVisible;
    this._areaHelpers.forEach(h => { h.visible = this._areaBoundsVisible; });
    this._sceneService.markDirty();
  }

  private _toggleFlyMode(): void {
    this.flyMode() ? this._exitFlyMode() : this._enterFlyMode();
  }

  private _enterFlyMode(): void {
    this._sceneService.cameraControls.enabled = false;
    this._flyControls = new FlyControls(
      this._sceneService.camera,
      this._sceneService.renderer.domElement,
    );
    this._flyControls.movementSpeed = 30;
    this._flyControls.rollSpeed = 0.5;
    this._flyControls.dragToLook = true;
    this._sceneService.onFrame = (delta) => this._flyControls?.update(delta);
    this.flyMode.set(true);
  }

  private _exitFlyMode(): void {
    this._flyControls?.dispose();
    this._flyControls = null;
    this._sceneService.onFrame = null;
    this._sceneService.cameraControls.enabled = true;
    this._sceneService.syncCameraState();
    this.flyMode.set(false);
  }

  private _addLabelsForProject(): void {
    this._context.project?.areas.forEach(area => {
      area.items.forEach(item => {
        if (item.obj3D) this._labels.addLabel(item.obj3D as THREE.Object3D);
      });
    });
  }

  private _buildAreaHelpers(): void {
    this._context.project?.areas
      .filter(a => a.name !== 'UNFITTED')
      .forEach(area => {
        if (!area.items.length) return;
        const box = new THREE.Box3();
        area.items.forEach(item => {
          if (item.obj3D) box.expandByObject(item.obj3D as THREE.Object3D);
        });
        if (box.isEmpty()) return;
        const helper = new THREE.Box3Helper(box, new THREE.Color(0x00ffff));
        helper.visible = this._areaBoundsVisible;
        this._sceneService.addToScene(helper);
        this._areaHelpers.push(helper);
      });
  }

  private _clearAreaHelpers(): void {
    this._areaHelpers.forEach(h => {
      this._sceneService.scene.remove(h);
      h.geometry.dispose();
    });
    this._areaHelpers = [];
  }

  private _updateBox3Helper(obj: THREE.Object3D | null): void {
    if (this._box3Helper) {
      this._sceneService.scene.remove(this._box3Helper);
      this._box3Helper.geometry.dispose();
      this._box3Helper = null;
    }
    if (obj && this._helpersVisible) {
      const box = new THREE.Box3().setFromObject(obj);
      this._box3Helper = new THREE.Box3Helper(box, new THREE.Color(0xffffff));
      this._sceneService.addToScene(this._box3Helper);
    }
    this._updateDimensionArrows(obj);
    this._sceneService.markDirty();
  }

  private _updateDimensionArrows(obj: THREE.Object3D | null): void {
    this._dimensionArrows.forEach(a => {
      this._sceneService.scene.remove(a);
      a.dispose();
    });
    this._dimensionArrows = [];
    if (!obj || !this._helpersVisible) return;

    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const min = box.min;

    const color = 0xffff00;
    const headRatio = 0.12;

    // Width  → +X from min corner
    const arrowX = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), min, size.x, color,
      size.x * headRatio, size.x * headRatio * 0.5,
    );
    // Height → +Y from min corner
    const arrowY = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), min, size.y, color,
      size.y * headRatio, size.y * headRatio * 0.5,
    );
    // Depth  → +Z from min corner
    const arrowZ = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), min, size.z, color,
      size.z * headRatio, size.z * headRatio * 0.5,
    );

    this._dimensionArrows = [arrowX, arrowY, arrowZ];
    this._sceneService.addToScene(...this._dimensionArrows);
  }

  private _applyHoverEmissive(mesh: THREE.Mesh): void {
    const item = mesh.userData as RenderedController;
    if (item.selected) return;
    (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x2a2a2a);
  }

  private _clearHoverEmissive(mesh: THREE.Mesh): void {
    const item = mesh.userData as RenderedController;
    if (item.selected) return;
    (mesh.material as THREE.MeshStandardMaterial).emissive.set(
      this._constants.BOX_COLOR_UNSET,
    );
  }
  //#endregion

  //#region Step rendering
  private handleStepNumber(): void {
    this._sceneService.mainGroup.children.forEach((x) =>
      this.checkVisibility(x, x.userData as RenderedController),
    );
    this._sceneService.markDirty();
  }

  private checkVisibility(obj: THREE.Object3D, data: RenderedController): void {
    // userData is {} (empty Object3D) when no RenderedController has been assigned
    if (!data || !('id' in data)) {
      obj.visible = true;
      return;
    }

    obj.visible = data.globalStep < 0 || data.globalStep === 1 || data.globalStep <= this._rewind.step;

    obj.children?.forEach((x) =>
      this.checkVisibility(x, x.userData as RenderedController),
    );
  }
  //#endregion

  //#region Scene construction
  private load(): void {
    if (!this._context.project) return;

    this._labels.clearLabels();
    this._clearAreaHelpers();
    this._sceneService.setOutlineSelected([]);
    this._sceneService.detachTransform();
    this._updateBox3Helper(null);
    const mainGroup = this._sceneService.resetMainGroup();

    this.setScene(mainGroup, this._context.project);
    this._addLabelsForProject();
    this._buildAreaHelpers();

    const data = this.getMinMax(this._context.project);

    // Position camera equidistant on all three axes so the initial view shows
    // the XYZ volume (top + front + side visible), not just the XZ plane.
    const d = Math.max(data.means.width, data.maxHeight, data.means.depth) * 2;
    const camPos = new THREE.Vector3(
      data.massCenter.x + d,
      data.massCenter.y + d,
      data.massCenter.z + d,
    );
    const camTarget = new THREE.Vector3(
      data.massCenter.x,
      data.massCenter.y,
      data.massCenter.z,
    );
    this._sceneService.setCamera(camPos, camTarget);
    this._sceneService.saveCameraState();

    this.addGrid(data);
    this.addLight();

    this._sceneService.markDirty();
    this._events.get(AppEvent.RENDERED).next();
  }

  private addGrid(data: IScene): void {
    const size = Math.floor(Math.max(data.means.width, data.means.depth));
    const dark = this._theme.isDark();

    this._grid = new THREE.GridHelper(
      size * 2,
      size / this._constants.GRID_SPACING,
      dark ? this._constants.GRID_COLOR_CENTER : 0x92400e,
      dark ? this._constants.GRID_COLOR_LINES  : 0xc8a77a,
    );
    this._grid.position.set(data.massCenter.x, data.massCenter.y, data.massCenter.z);
    this._sceneService.addToScene(this._grid);

    const axisSize = data.maxHeight + data.maxHeight * 0.1;
    this._axes = new THREE.AxesHelper(axisSize);
    this._sceneService.addToScene(this._axes);
    this._helpersVisible = true;
  }

  private addLight(): void {
    this._ambientLight = new THREE.AmbientLight(
      0xffffff,
      this._graphics.settings().ambientIntensity,
    );

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(1, 2, 1.5);

    this._sceneService.addToScene(this._ambientLight, dirLight);
  }

  private setScene(parent: THREE.Object3D, data: Project): void {
    const fittedAreas = data.areas.filter((a) => a.name !== 'UNFITTED');
    const unfittedArea = data.areas.find((a) => a.name === 'UNFITTED');

    // ── Áreas reales ──────────────────────────────────────────────────────────
    fittedAreas.forEach((c) => {
      const container = this.drawContainer(parent, c);
      c.setObj3D(container.obj3d);

      this.drawExitCorridor(container.obj3d, c);

      c.items.forEach((item) => {
        const box = this.drawBox(item, c);
        box.obj3d.userData = item;
        container.obj3d.add(box.obj3d);

        const textSize = Math.min(4, Math.min(box.means.width, box.means.height, box.means.depth) * 0.12);
        const offset = -(textSize / 2);
        this._text.addTo(box.obj3d, {
          label: item.globalStep.toString(),
          position: { x: offset, y: offset, z: offset },
          geometryParameters: { size: textSize, depth: 0.1 } as TextGeometryParameters,
        });

        item.setObj3D(box.obj3d);
      });
    });

    // ── Área UNFITTED — desplazada a la derecha del espacio real ─────────────
    if (unfittedArea) {
      // Use means.width (original area size) — the outer yellow wireframe is
      // drawn from means, so the gap must clear that boundary, not fixedMeans.
      const maxX = fittedAreas.reduce(
        (m, a) => Math.max(m, a.position.x + a.means.width),
        0,
      );
      const gap = Math.max(15, maxX * 0.1);
      unfittedArea.position.set({ x: maxX + gap, y: 0, z: 0 });

      const dark = this._theme.isDark();
      const container = this.drawContainer(
        parent,
        unfittedArea,
        dark ? '#ef4444' : '#b91c1c',
        dark ? '#f87171' : '#dc2626',
      );
      unfittedArea.setObj3D(container.obj3d);

      unfittedArea.items.forEach((item) => {
        const box = this.drawBox(item, unfittedArea);
        box.obj3d.userData = item;
        container.obj3d.add(box.obj3d);

        const textSize = Math.min(4, Math.min(box.means.width, box.means.height, box.means.depth) * 0.12);
        const offset = -(textSize / 2);
        this._text.addTo(box.obj3d, {
          label: item.globalStep.toString(),
          position: { x: offset, y: offset, z: offset },
          geometryParameters: { size: textSize, depth: 0.1 } as TextGeometryParameters,
        });

        item.setObj3D(box.obj3d);
      });
    }
  }

  private getMinMax(data: Project): IScene {
    const positions = data.areas.map((x) => x.position);
    const heights = data.areas.map((x) => x.means.height);

    const min: IMeasurements = {
      width: Math.min(...positions.map((p) => p.x)),
      height: Math.min(...positions.map((p) => p.y)),
      depth: Math.min(...positions.map((p) => p.z)),
    };

    const max: IMeasurements = {
      width: Math.max(...positions.map((p) => p.x)),
      height: Math.max(...positions.map((p) => p.y)),
      depth: Math.max(...positions.map((p) => p.z)),
    };

    const maxHeight = Math.max(...heights);
    const massCenter: IPosition = { x: max.width, y: max.height, z: max.depth };
    const means: IMeasurements = {
      width: Math.abs(max.width) + Math.abs(min.width),
      height: Math.abs(max.height) + Math.abs(min.height),
      depth: Math.abs(max.depth) + Math.abs(min.depth),
    };

    return { minMeans: min, maxMeans: max, means, maxHeight, massCenter };
  }
  //#endregion

  //#region Drawing helpers
  private getFixedData(item: RenderedController) {
    const { x, y, z } = item.position;
    const { width, height, depth } = item.fixedMeans;
    return { position: { x, y, z }, means: { width, height, depth } };
  }

  private getFixedDataOnParent(item: RenderedController, parent?: RenderedController) {
    const fix = this.getFixedData(item);
    const position: IPosition = { ...fix.position };

    position.x += fix.means.width / 2;
    position.y += fix.means.height / 2;
    position.z += fix.means.depth / 2;

    if (parent) {
      const fixParent = this.getFixedData(parent);
      position.x -= fixParent.means.width / 2;
      position.y -= fixParent.means.height / 2;
      position.z -= fixParent.means.depth / 2;
    }

    return { position, means: fix.means };
  }

  private drawWire(item: RenderedController) {
    const fix = this.getFixedData(item);
    const mat = new THREE.LineBasicMaterial({ color: item.color });
    const geometry = new THREE.EdgesGeometry(
      new BoxGeometry(fix.means.width, fix.means.height, fix.means.depth),
    );
    const obj3d = new THREE.LineSegments(geometry, mat);

    obj3d.uuid = item.id;
    obj3d.name = item.name;
    obj3d.position.x = fix.position.x + fix.means.width / 2;
    obj3d.position.y = fix.position.y + fix.means.height / 2;
    obj3d.position.z = fix.position.z + fix.means.depth / 2;

    return { obj3d, ...fix };
  }

  private drawBox(item: RenderedController, parent?: RenderedController) {
    const data = this.getFixedDataOnParent(item, parent);
    const mat = new THREE.MeshStandardMaterial({
      color: item.color,
      opacity: this._constants.BOX_OPACITY,
      metalness: this._constants.BOX_METALNESS,
      roughness: this._constants.BOX_ROUGHNESS,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    mat.color.convertSRGBToLinear();

    const geometry = new BoxGeometry(data.means.width, data.means.height, data.means.depth);
    const obj3d = new THREE.Mesh(geometry, mat);

    obj3d.uuid = item.id;
    obj3d.name = item.name;
    obj3d.position.set(data.position.x, data.position.y, data.position.z);

    return { obj3d, ...data };
  }

  /**
   * Draws the forbidden region the user marked as a non-blockable access path.
   * The mesh is translucent red so the user can spot it without obstructing
   * the placed boxes; the wireframe makes it visible from any camera angle.
   * Coordinates are area-local — the mesh is added to the area container so
   * it inherits its transform.
   */
  private drawExitCorridor(parent: THREE.Object3D, area: RenderedController): void {
    if (!(area instanceof Area) || !area.exitCorridor) return;

    const dark = this._theme.isDark();
    const c = area.exitCorridor;

    const mat = new THREE.MeshStandardMaterial({
      color: dark ? 0xef4444 : 0xb91c1c,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const geometry = new BoxGeometry(c.width, c.height, c.depth);
    const mesh = new THREE.Mesh(geometry, mat);

    // Position relative to area centre — area.fixedMeans/means already centre the parent at (0,0,0).
    mesh.position.x = c.x + c.width  / 2 - area.means.width  / 2;
    mesh.position.y = c.y + c.height / 2 - area.means.height / 2;
    mesh.position.z = c.z + c.depth  / 2 - area.means.depth  / 2;

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: dark ? 0xff7777 : 0xdc2626 }),
    );
    wire.position.copy(mesh.position);

    parent.add(mesh, wire);
  }

  private drawContainer(
    parent: THREE.Object3D,
    item: RenderedController,
    innerColor?: string,
    outerColor?: string,
  ) {
    const dark = this._theme.isDark();

    // Container object — the THREE.js parent that box meshes attach to.
    // Positioned using the backend fixedMeans so that box local-→world math
    // (getFixedDataOnParent) continues to work correctly.
    item.setColor(innerColor ?? (dark ? '#ff2222' : '#b91c1c'));
    const fixed = this.drawWire(item);
    parent.add(fixed.obj3d);

    // Inner (red) visual wire — shows the actual used-space bbox in user-space
    // coordinates, computed from the placed items instead of the canonical
    // fixedMeans that the backend returns (canonical ≠ user-space for flipped
    // access corners such as BottomFrontRight or BottomBackLeft).
    const items = item.items;
    if (items.length > 0) {
      const minX = Math.min(...items.map(i => i.position.x));
      const minY = Math.min(...items.map(i => i.position.y));
      const minZ = Math.min(...items.map(i => i.position.z));
      const maxX = Math.max(...items.map(i => i.position.x + i.fixedMeans.width));
      const maxY = Math.max(...items.map(i => i.position.y + i.fixedMeans.height));
      const maxZ = Math.max(...items.map(i => i.position.z + i.fixedMeans.depth));

      const bboxW = maxX - minX;
      const bboxH = maxY - minY;
      const bboxD = maxZ - minZ;

      const innerMat = new THREE.LineBasicMaterial({ color: item.color });
      const innerGeom = new THREE.EdgesGeometry(new BoxGeometry(bboxW, bboxH, bboxD));
      const innerWire = new THREE.LineSegments(innerGeom, innerMat);

      // Position relative to the parent (scene group), not to the container.
      innerWire.position.set(
        item.position.x + minX + bboxW / 2,
        item.position.y + minY + bboxH / 2,
        item.position.z + minZ + bboxD / 2,
      );
      parent.add(innerWire);
    }

    // Outer (yellow) wire — full declared area dimensions.
    const clone = new RenderedController('', '', '', {
      type: 'area',
      targetable: false,
      means: item.means,
      position: item.position,
      rotation: Rotation.WHD,
    });
    clone.setColor(outerColor ?? (dark ? '#ffee00' : '#92400e'));

    const normal = this.drawWire(clone);
    parent.add(normal.obj3d);

    return fixed;
  }
  //#endregion
}
