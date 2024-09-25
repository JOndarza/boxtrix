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
import {
  FocusedItem,
  FocusManagerService,
} from '@shared/services/focusManager.service';
import { debounceTime } from 'rxjs';
import * as THREE from 'three';
import { BoxGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextManager } from '@shared/services/TextManager.service';
import { BoxTrixContainer } from '@common/classes/news/Container.class';
import { RenderedController } from '@common/classes/news/Rendered.controller';
import { IMeasurements, IPosition } from '@common/interfaces/Data.interface';
import { Rotation } from '@common/enums/Rotation.enum';
import { RewindManagerService } from '@shared/services/RewindManager.service';
import _ from 'lodash';

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
  private _points = false;

  private _delta = 0;
  private _mainGroup!: THREE.Object3D;
  private _raycaster = new THREE.Raycaster();
  private _pointer = new THREE.Vector2();
  private _visibleContainers = new Array();

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
      .get<string>(AppEvent.CLICKED)
      .pipe(debounceTime(50))
      .subscribe(this.selectByCLick.bind(this));

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
    this._controls.keys = {
      LEFT: '37', //left arrow
      UP: '38', // up arrow
      RIGHT: '39', // right arrow
      BOTTOM: '40', // down arrow
    };

    this._controls.addEventListener('change', () => {
      if (this._renderer) this._renderer.render(this._scene, this._camera);
    });

    this._mainGroup = new THREE.Object3D();
    this._scene.add(this._mainGroup);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    document.addEventListener('keyup', this.onDocumentKeyUp.bind(this), false);
    document.addEventListener(
      'keydown',
      this.onDocumentKeyDown.bind(this),
      false
    );
    document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  }

  // HACK: TO WOTK
  private animate = (): void => {
    this._controls.update();

    this._delta += 0.01;
    this.handleIntersection();

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

  private onDocumentKeyDown(event: { which: any }) {
    var keyCode = event.which;
    switch (keyCode) {
      case KeyCode.W: {
        break;
      }
      case KeyCode.S: {
        break;
      }
      case KeyCode.D: {
        this._rewind.forward();

        break;
      }
      case KeyCode.A: {
        this._rewind.back();

        break;
      }
      case 80: {
        this._points = !this._points;
        if (this._points) {
          console.log('Show points');
        } else {
          console.log('Hide points');
        }

        this.handleStepNumber();
        this.renderScene();

        break;
      }
      default: {
        break;
      }
    }
  }

  private onDocumentKeyUp(event: { which: any }) {}

  private onMouseMove(event: MouseEvent): void {
    event.preventDefault();

    this._pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this._pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  handleStepNumber() {
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

  private handleIntersection(): void {
    this._raycaster.setFromCamera(this._pointer, this._camera);

    let target = null;
    for (var i = 0; i < this._visibleContainers.length; i++) {
      for (var k = 0; k < this._visibleContainers[i].children.length; k++) {
        var intersects = this._raycaster.intersectObjects(
          this._visibleContainers[i].children[k].children
        );
        if (intersects.length > 0) {
          target = intersects[0].object;
        }
      }
    }

    this.selectRaycast(target);
  }

  selectRaycast(target: THREE.Object3D<THREE.Object3DEventMap> | null) {
    const obj3DRAYCAST = this._focus.getObj3D(FocusedItem.RAYCAST);

    if (!target) {
      if (obj3DRAYCAST) {
        this._focus
          .get(FocusedItem.RAYCAST)
          .render.changeColorEmissive(this._contants.BOX_COLOR_UNSET);
        this._focus.set(FocusedItem.RAYCAST, null);
      }
      return;
    }

    if (obj3DRAYCAST != target) {
      if (obj3DRAYCAST)
        this._focus
          .get(FocusedItem.RAYCAST)
          .render.changeColorEmissive(this._contants.BOX_COLOR_UNSET);

      this._focus
        .set(FocusedItem.RAYCAST, target)
        .render.changeColorEmissive(this._contants.BOX_COLOR_RAYCAST);
    }

    this._focus.set(FocusedItem.CLICKED, null);
  }

  selectClicked(target: THREE.Object3D | null) {
    const obj3DCLICKED = this._focus.getObj3D(FocusedItem.CLICKED);
    if (!target || obj3DCLICKED === target) return;

    if (obj3DCLICKED)
      this._focus
        .get(FocusedItem.CLICKED)
        .render.changeColorEmissive(this._contants.BOX_COLOR_UNSET);

    this._focus
      .set(FocusedItem.CLICKED, target)
      .render.changeColorEmissive(this._contants.BOX_COLOR_CLICKED);
  }

  selectByCLick(id: string) {
    let target = null;

    for (var i = 0; i < this._visibleContainers.length; i++) {
      for (var k = 0; k < this._visibleContainers[i].children.length; k++) {
        const children = this._visibleContainers[i].children[k].children;
        if ((target = children.find((x: any) => x.uuid == id))) {
          break;
        }
      }
    }

    this.selectClicked(target);
  }
  //#endregion THREE

  //#region Models
  private load() {
    if (!this._context.container) return;

    this._scene.clear();

    const mainGroup = new THREE.Object3D();
    this._scene.add(mainGroup);
    this._mainGroup = mainGroup;

    for (var i = 0; i < this._visibleContainers.length; i++)
      mainGroup.remove(this._visibleContainers[i]);

    const data = this.addContainer(mainGroup, this._context.container);
    this._context.container.unffited.forEach((x) =>
      this.addContainer(mainGroup, x)
    );

    this._camera.position.z = data.maxY * 2;
    this._camera.position.y = data.maxZ * 1.25;
    this._camera.position.x = data.maxX * 2;

    this.addGrid(data.maxX, data.maxZ);

    this.addLight();

    this._events.get(AppEvent.RENDERED).emit();
  }

  private addGrid(maxX: number, maxZ: number) {
    var size =
      Math.max(maxZ, maxX) +
      this._contants.GRID_SPACING +
      this._contants.GRID_SPACING;

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
      means: item.means,
      position: item.position,
      rotation: Rotation.WHD,
    });
    clone.setColor('#FF0');

    let normal = this.drawWire(clone);
    parent.add(normal.obj3d);

    return fixed;
  }

  private addContainer(parent: THREE.Object3D, data: BoxTrixContainer) {
    let maxX = 0;
    let maxY = 0;
    let maxZ = 0;

    const container = this.drawContainer(parent, data);

    data.items.forEach((item) => {
      const box = this.drawBox(item, data);
      box.obj3d.userData = item;
      container.obj3d.add(box.obj3d);

      const size = 0.5;
      const offset = -size / 2;
      this._text.addTo(box.obj3d, {
        label: item.globalStep.toString(),
        geometryParameters: { size },
        position: { x: offset, y: offset, z: offset },
      });
    });

    if (data.means.width > maxX) maxX = data.means.width;
    if (data.means.height > maxY) maxY = data.means.height;
    if (data.means.depth > maxZ) maxZ = data.means.depth;

    container.obj3d.userData = data;

    return { maxX, maxY, maxZ };
  }
  //#endregion
}
