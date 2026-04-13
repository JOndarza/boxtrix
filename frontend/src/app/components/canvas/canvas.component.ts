import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { IMeasurements, IPosition } from '@common/dtos/Data.interface';
import { Rotation } from '@common/enums/Rotation.enum';
import { IScene } from '@common/interfaces/Scene.interface';
import { ConstantsService } from '@shared/services/Constants.service';
import { ContextService } from '@shared/services/Context.service';
import { AppEvent, EventsService } from '@shared/services/Events.service';
import { FocusManagerService } from '@shared/services/FocusManager.service';
import { RewindManagerService } from '@shared/services/RewindManager.service';
import { SceneService } from '@shared/services/Scene.service';
import { TextManagerService } from '@shared/services/TextManager.service';
import { debounceTime } from 'rxjs';
import * as THREE from 'three';
import { BoxGeometry } from 'three';
import { TextGeometryParameters } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Project } from '@common/classes/rendered/Project.class';

export enum KeyCode {
  A = 65,
  D = 68,
  W = 87,
  S = 83,
}

@Component({
  standalone: true,
  selector: 'app-canvas',
  template: `<div #canvas class="canvas"></div>`,
  providers: [SceneService],
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
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _pointer = new THREE.Vector2();

  // C2 — bound refs stored so removeEventListener can target the same function
  private readonly _onWindowResize = (): void =>
    this._sceneService.onResize(this.canvas.nativeElement);
  private readonly _onKeyDown = (e: KeyboardEvent): void => this.handleKeyDown(e);
  private readonly _onCanvasClick = (e: MouseEvent): void => this.handleCanvasClick(e);

  ngOnInit(): void {
    this._sceneService.init(this.canvas.nativeElement);

    // C1 — takeUntilDestroyed prevents subscriptions from leaking past component lifetime
    this._events
      .get(AppEvent.RENDERING)
      .pipe(debounceTime(100), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.load());

    this._rewind.updated
      .pipe(debounceTime(50), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.handleStepNumber());

    window.addEventListener('resize', this._onWindowResize);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('click', this._onCanvasClick);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this._onWindowResize);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('click', this._onCanvasClick);
    // SceneService teardown (renderer.dispose, forceContextLoss, scene.clear)
    // is handled by Angular when it destroys the component-scoped injector.
  }

  //#region Input handlers
  private handleKeyDown(event: KeyboardEvent): void {
    // Guard: don't steal keypresses when a text input has focus
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    // M4 / C3 — event.which is deprecated; use event.code
    switch (event.code) {
      case 'KeyD':
        this._rewind.forward();
        break;
      case 'KeyA':
        this._rewind.back();
        break;
    }
  }

  private handleCanvasClick(event: MouseEvent): void {
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

    this._focus.set(filter[0].object);
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

    obj.visible = data.globalStep === 1 || data.globalStep <= this._rewind.step;

    obj.children?.forEach((x) =>
      this.checkVisibility(x, x.userData as RenderedController),
    );
  }
  //#endregion

  //#region Scene construction
  private load(): void {
    if (!this._context.project) return;

    const mainGroup = this._sceneService.resetMainGroup();

    this.setScene(mainGroup, this._context.project);

    const data = this.getMinMax(this._context.project);

    this._sceneService.camera.position.x = data.means.width * 2;
    this._sceneService.camera.position.y = data.maxHeight * 1.25;
    this._sceneService.camera.position.z = data.means.depth * 2;
    this._sceneService.camera.lookAt(
      new THREE.Vector3(data.massCenter.x, data.massCenter.y, data.massCenter.z),
    );

    this.addGrid(data);
    this.addLight();

    this._sceneService.markDirty();
    this._events.get(AppEvent.RENDERED).next();
  }

  private addGrid(data: IScene): void {
    const size = Math.floor(Math.max(data.means.width, data.means.depth));

    const grid = new THREE.GridHelper(
      size * 2,
      size / this._constants.GRID_SPACING,
      0x42a5f5,
      0x42a5f5,
    );
    grid.position.set(data.massCenter.x, data.massCenter.y, data.massCenter.z);
    this._sceneService.addToScene(grid);

    const axisSize = data.maxHeight + data.maxHeight * 0.1;
    this._sceneService.addToScene(new THREE.AxesHelper(axisSize));

    const geometryParameters = { size: 15, depth: 2 } as TextGeometryParameters;
    this._text.addTo(
      this._sceneService.scene,
      { label: 'Width', position: { x: axisSize, y: 0, z: 0 }, geometryParameters },
      { label: 'Height', position: { x: 0, y: axisSize, z: 0 }, geometryParameters },
      { label: 'Depth', position: { x: 0, y: 0, z: axisSize }, geometryParameters },
    );
  }

  private addLight(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this._sceneService.addToScene(ambientLight);
  }

  private setScene(parent: THREE.Object3D, data: Project): void {
    data.areas.forEach((c) => {
      const container = this.drawContainer(parent, c);
      c.setObj3D(container.obj3d);

      c.items.forEach((item) => {
        const box = this.drawBox(item, c);
        box.obj3d.userData = item;
        container.obj3d.add(box.obj3d);

        const geometryParameters = { size: 15, depth: 2 } as TextGeometryParameters;
        const offset = -(geometryParameters.size ?? 1) / 2;
        this._text.addTo(box.obj3d, {
          label: item.globalStep.toString(),
          position: { x: offset, y: offset, z: offset },
          geometryParameters,
        });

        item.setObj3D(box.obj3d);
      });
    });
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

  private drawContainer(parent: THREE.Object3D, item: RenderedController) {
    item.setColor('#F00');
    const fixed = this.drawWire(item);
    parent.add(fixed.obj3d);

    const clone = new RenderedController('', '', '', {
      type: 'area',
      targetable: false,
      means: item.means,
      position: item.position,
      rotation: Rotation.WHD,
    });
    clone.setColor('#FF0');

    const normal = this.drawWire(clone);
    parent.add(normal.obj3d);

    return fixed;
  }
  //#endregion
}
