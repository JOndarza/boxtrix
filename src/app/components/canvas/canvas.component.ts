import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ContantsService } from '@shared/services/contants.service';
import { ContextService } from '@shared/services/context.service';
import { AppEvent, EventsService } from '@shared/services/events.service';
import { FocusManagerService } from '@shared/services/focusManager.service';
import { debounceTime } from 'rxjs';
import * as THREE from 'three';
import { BoxGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextManager } from '@shared/services/TextManager.service';
import { RenderedController } from '@common/classes/rendered/Rendered.controller';
import { IMeasurements, IPosition } from '@common/interfaces/Data.interface';
import { Rotation } from '@common/enums/Rotation.enum';
import { RewindManagerService } from '@shared/services/RewindManager.service';
import _ from 'lodash';
import { Project } from '@common/classes/rendered/Project.class';

export const enum KeyCode {
  A = 65,
  D = 68,
  W = 87,
  S = 83,
}

@Component({
  selector: 'app-canvas',
  template: `<div #canvas class="canvas"></div>`,
})
export class CanvasComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef;

  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _controls!: OrbitControls;
  private _frameId!: number;

  private _delta = 0;
  private _mainGroup!: THREE.Object3D;
  private _raycaster = new THREE.Raycaster();
  private _pointer = new THREE.Vector2();

  constructor(
    private _contants: ContantsService,
    private _events: EventsService,
    private _focus: FocusManagerService,
    private _rewind: RewindManagerService,
    private _text: TextManager,
    private _context: ContextService
  ) {}

  //#region THREE
  ngOnInit(): void {
    this.initScene();
    this.animate();

    this._events
      .get(AppEvent.RENDERING)
      .pipe(debounceTime(100))
      .subscribe(this.load.bind(this));

    this._events
      .get(AppEvent.CLICKED)
      .pipe(debounceTime(50))
      .subscribe(this.selectItem.bind(this));

    this._rewind.updated
      .pipe(debounceTime(50))
      .subscribe(this.handleStepNumber.bind(this));
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this._frameId);
    window.removeEventListener('resize', this.onWindowResize);
  }

  initScene(): void {
    const width = this.canvas.nativeElement.clientWidth;
    const height = this.canvas.nativeElement.clientHeight;

    // Initialize renderer
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this._renderer.setSize(width, height);
    this.canvas.nativeElement.appendChild(this._renderer.domElement);

    // Initialize scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color('#000');

    // Initialize camera
    this._camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 10000);
    this._camera.position.set(-50, 50, -50);

    // Initialize controls
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.25;
    this._controls.enableZoom = true;
    this._controls.autoRotate = false;

    this._controls.addEventListener('change', () => {
      if (this._renderer) this._renderer.render(this._scene, this._camera);
    });

    this._mainGroup = new THREE.Object3D();
    this._scene.add(this._mainGroup);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    document.addEventListener('keydown', this.onKeyDown.bind(this), false);
    document.addEventListener('click', this.onMouseMove.bind(this), false);
  }

  // HACK: TO WOTK
  private animate = (): void => {
    this._controls.update();

    this._delta += 0.01;

    this.renderScene();
    this._frameId = requestAnimationFrame(this.animate);
  };

  private renderScene(): void {
    if (this._renderer) {
      this._renderer.render(this._scene, this._camera);
    }
  }

  private onWindowResize(): void {
    const width = this.canvas.nativeElement.clientWidth;
    const height = this.canvas.nativeElement.clientHeight;

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height);
  }

  private onKeyDown(event: { which: any }) {
    var keyCode = event.which;
    switch (keyCode) {
      case KeyCode.D: {
        this._rewind.forward();

        break;
      }
      case KeyCode.A: {
        this._rewind.back();
        break;
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this._pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this._pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this._raycaster.setFromCamera(this._pointer, this._camera);

    const intersects = this._raycaster.intersectObject(this._mainGroup, true);
    if (!intersects.length) return;

    const filter = intersects.filter(
      (x) => (x.object.userData as RenderedController)?.targetable
    );
    if (!filter.length) return;

    this._focus.set(filter[0].object);
  }

  private handleStepNumber() {
    this._mainGroup.children.forEach((x) =>
      this.checkVisivility(x, x.userData as RenderedController)
    );
  }

  private checkVisivility(obj: THREE.Object3D, data: RenderedController) {
    if (!data || _.isEmpty(data)) {
      obj.visible = true;
      return;
    }

    obj.visible = data.globalStep === 1 || data.globalStep <= this._rewind.step;

    obj.children?.forEach((x) =>
      this.checkVisivility(x, x.userData as RenderedController)
    );
  }

  private selectItem() {}

  //#endregion THREE

  //#region Models
  private load() {
    if (!this._context.project) return;

    this._scene.clear();

    const mainGroup = new THREE.Object3D();
    this._scene.add(mainGroup);
    this._mainGroup = mainGroup;

    const data = this.setScene(mainGroup, this._context.project);

    this._camera.position.z = data.max.height * 2;
    this._camera.position.y = data.max.depth * 1.25;
    this._camera.position.x = data.max.width * 2;

    this.addGrid(data.max.width, data.max.depth);

    this.addLight();

    this._events.get(AppEvent.RENDERED).emit();
  }

  private addGrid(maxX: number, maxZ: number) {
    var size = Math.floor(Math.max(maxZ, maxX));

    let grid = new THREE.GridHelper(
      size,
      size / this._contants.GRID_SPACING,
      0x42a5f5,
      0x42a5f5
    );

    grid.position.x = size / 2;
    grid.position.y = 0;
    grid.position.z = size / 2;

    this._scene.add(grid);

    const axesHelper = new THREE.AxesHelper(50);
    this._scene.add(axesHelper);

    this._text.addTo(
      this._scene,
      { label: 'X', position: { x: size, y: 0, z: 0 } },
      { label: 'Y', position: { x: 0, y: size, z: 0 } },
      { label: 'Z', position: { x: 0, y: 0, z: size } }
    );
  }

  private addLight() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this._scene.add(ambientLight);
  }

  private setScene(
    parent: THREE.Object3D,
    data: Project
  ): { min: IMeasurements; max: IMeasurements } {
    data.containers.forEach((c) => {
      const container = this.drawContainer(parent, c);
      c.setObj3D(container.obj3d);

      c.items.forEach((item) => {
        const box = this.drawBox(item, c);
        box.obj3d.userData = item;
        container.obj3d.add(box.obj3d);

        const size = 0.5;
        const offset = -size / 2;
        this._text.addTo(box.obj3d, {
          label: item.globalStep.toString(),
          geometryParameters: { size },
          position: { x: offset, y: offset, z: offset },
        });

        item.setObj3D(box.obj3d);
      });
    });

    return {
      min: {
        width: _.chain(data.containers)
          .map((x) => x.means.width)
          .min()
          .value(),
        height: _.chain(data.containers)
          .map((x) => x.means.height)
          .min()
          .value(),
        depth: _.chain(data.containers)
          .map((x) => x.means.depth)
          .min()
          .value(),
      },
      max: {
        width: _.chain(data.containers)
          .map((x) => x.means.width)
          .max()
          .value(),
        height: _.chain(data.containers)
          .map((x) => x.means.height)
          .max()
          .value(),
        depth: _.chain(data.containers)
          .map((x) => x.means.depth)
          .max()
          .value(),
      },
    };
  }
  //#endregion Models

  //#region
  private fixOrderPosition(position: IPosition) {
    return { x: position.x, y: position.y, z: position.z };
  }

  private fixOrderMeans(position: IMeasurements) {
    return {
      width: position.width,
      height: position.height,
      depth: position.depth,
    };
  }

  private getFixedData(item: RenderedController) {
    const position = this.fixOrderPosition(item.position);
    const means = this.fixOrderMeans(item.fixedMeans);

    return { position, means };
  }

  private getFixedDataOnParent(
    item: RenderedController,
    parent?: RenderedController
  ) {
    const fix = this.getFixedData(item);

    const position: IPosition = {
      x: fix.position.x,
      y: fix.position.y,
      z: fix.position.z,
    };

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

    var mat = new THREE.LineBasicMaterial({ color: item.color });
    var geometry = new THREE.EdgesGeometry(
      new BoxGeometry(fix.means.width, fix.means.height, fix.means.depth)
    );

    var obj3d = new THREE.LineSegments(geometry, mat);

    obj3d.uuid = item.id;
    obj3d.name = item.name;
    obj3d.position.x = fix.position.x + fix.means.width / 2;
    obj3d.position.y = fix.position.y + fix.means.height / 2;
    obj3d.position.z = fix.position.z + fix.means.depth / 2;

    return { obj3d, ...fix };
  }

  private drawBox(item: RenderedController, parent?: RenderedController) {
    const data = this.getFixedDataOnParent(item, parent);

    var mat = new THREE.MeshStandardMaterial({
      color: item.color,
      opacity: this._contants.BOX_OPACITY,
      metalness: this._contants.BOX_METALNESS,
      roughness: this._contants.BOX_ROUGHNESS,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    mat.color.convertSRGBToLinear();

    var geometry = new BoxGeometry(
      data.means.width,
      data.means.height,
      data.means.depth
    );
    var obj3d = new THREE.Mesh(geometry, mat);

    obj3d.uuid = item.id;
    obj3d.name = item.name;
    obj3d.position.x = data.position.x;
    obj3d.position.y = data.position.y;
    obj3d.position.z = data.position.z;

    return { obj3d, ...data };
  }

  private drawContainer(parent: THREE.Object3D, item: RenderedController) {
    item.setColor('#F00');
    let fixed = this.drawWire(item);
    parent.add(fixed.obj3d);

    const clone = new RenderedController('', '', '', {
      type: 'container',
      targable: false,
      means: item.means,
      position: item.position,
      rotation: Rotation.WHD,
    });
    clone.setColor('#FF0');

    let normal = this.drawWire(clone);
    parent.add(normal.obj3d);

    return fixed;
  }
  //#endregion
}
