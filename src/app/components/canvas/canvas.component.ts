import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Box } from '@common/classes/Box.class';
import { Container } from '@common/classes/Container.class';
import { InputObject } from '@common/classes/InputObject';
import { MemoryColorScheme } from '@common/classes/MemoryColorScheme.class';
import { Point } from '@common/classes/Point.class';
import { RandomColorScheme } from '@common/classes/RandomColorScheme.class';
import { StackableRenderer } from '@common/classes/StackableRenderer.class';
import { StackPlacement } from '@common/classes/StackPlacement.class';
import { ContantsService } from '@shared/services/contants.service';
import { ContextService } from '@shared/services/context.service';
import { AppEvent, EventsService } from '@shared/services/events.service';
import {
  FocusedItem,
  FocusManagerService,
} from '@shared/services/focusManager.service';
import { RewindManagerService } from '@shared/services/rewindManager.service';
import { debounceTime } from 'rxjs';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const enum KeyCode {
  A = 65,
  D = 68,
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
  private _shouldAnimate!: boolean;
  private _points = false;

  private _delta = 0;
  private _mainGroup!: THREE.Object3D;
  private _raycaster = new THREE.Raycaster();
  private _pointer = new THREE.Vector2();
  private _visibleContainers = new Array();

  private _stackableRenderer: StackableRenderer;
  private _memoryColorScheme: MemoryColorScheme;

  constructor(
    private _contants: ContantsService,
    private _events: EventsService,
    private _focus: FocusManagerService,
    private _rewind: RewindManagerService,
    private _context: ContextService
  ) {
    this._stackableRenderer = new StackableRenderer(this._contants);
    this._memoryColorScheme = new MemoryColorScheme(new RandomColorScheme());
  }

  //#region THREE
  ngOnInit(): void {
    this.initScene();
    this.animate();

    this._events
      .get(AppEvent.LOADED)
      .pipe(debounceTime(100))
      .subscribe(this.load.bind(this));

    this._events
      .get<string>(AppEvent.CLICKED)
      .pipe(debounceTime(50))
      .subscribe(this.selectByCLick.bind(this));
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

    // Rotate orbit
    this._mainGroup.rotation.z += this._contants.ANGULAR_VELOCITY;

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
    this._shouldAnimate = false;
    var keyCode = event.which;
    switch (keyCode) {
      case 87: {
        this._mainGroup.rotation.y += 0.1;
        break;
      }
      case 83: {
        this._mainGroup.rotation.y -= 0.1;
        break;
      }
      case KeyCode.D: {
        this._rewind.forward();

        this.handleStepNumber();

        break;
      }
      case KeyCode.A: {
        this._rewind.back();
        this.handleStepNumber();

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

  private onDocumentKeyUp(event: { which: any }) {
    var keyCode = event.which;
    this._shouldAnimate = true;
  }

  private onMouseMove(event: MouseEvent): void {
    event.preventDefault();

    this._pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this._pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  handleStepNumber() {
    for (var i = 0; i < this._visibleContainers.length; i++) {
      var visibleContainer = this._visibleContainers[i];

      var visibleContainerUserData = visibleContainer.userData;
      visibleContainer.visible =
        visibleContainerUserData.step < this._rewind.stepNumber;

      this._stackableRenderer.removePoints(visibleContainer);
      if (this._points) {
        this._stackableRenderer.addPoints(
          visibleContainer,
          this._memoryColorScheme,
          this._rewind.stepNumber
        );
      }

      for (var k = 0; k < this._visibleContainers[i].children.length; k++) {
        var container = this._visibleContainers[i].children[k];
        var containerUserData = container.userData;

        container.visible = containerUserData.step < this._rewind.stepNumber;

        var stackables = container.children;
        for (var j = 0; j < stackables.length; j++) {
          var stackable = stackables[j];
          var userData = stackables[j].userData;

          if (userData.type === 'box') {
            stackable.visible = userData.step < this._rewind.stepNumber;
          }
        }
      }
    }
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
    if (!this._context.input) return;

    this._scene.clear();

    const mainGroup = new THREE.Object3D();
    this._scene.add(mainGroup);

    for (var i = 0; i < this._visibleContainers.length; i++)
      mainGroup.remove(this._visibleContainers[i]);

    const container = this.addContainer(mainGroup, this._context.input);

    this._camera.position.z = container.maxY * 2;
    this._camera.position.y = container.maxZ * 1.25;
    this._camera.position.x = container.maxX * 2;

    this.addGrid(container.maxY, container.maxX);

    this.addLight();
  }

  private addContainer(mainGroup: THREE.Object3D, packaging: InputObject) {
    var maxX = 0;
    var maxY = 0;
    var maxZ = 0;

    var minStep = -1;
    var maxStep = -1;

    packaging.containers.forEach((origin) => {
      const container = new Container(
        origin.name,
        origin.id,
        origin.step,
        origin.dx,
        origin.dy,
        origin.dz,
        origin.loadDx,
        origin.loadDy,
        origin.loadDz
      );

      if (container.step < minStep || minStep == -1) minStep = container.step;
      if (container.step > maxStep || maxStep == -1) maxStep = container.step;

      origin.stack.placements.forEach((placement) => {
        const stackable = placement.stackable;

        if (stackable.step < minStep || minStep == -1) minStep = stackable.step;
        if (stackable.step > maxStep || maxStep == -1) maxStep = stackable.step;

        var points = placement.points?.map(
          (x) => new Point(x.x, x.y, x.z, x.dx, x.dy, x.dz)
        );

        switch (stackable.type) {
          case 'box':
            var box = new Box(
              stackable.name,
              stackable.id,
              stackable.step,
              stackable.dx,
              stackable.dy,
              stackable.dz
            );

            container.add(
              new StackPlacement(
                box,
                placement.step,
                placement.x,
                placement.y,
                placement.z,
                points
              )
            );
            break;
        }
      });

      const maxStepNumber = maxStep + 1;
      this._rewind.set(maxStepNumber, 1, maxStepNumber);
      let x = 0;
      const visibleContainer = this._stackableRenderer.add(
        mainGroup,
        this._memoryColorScheme,
        new StackPlacement(container, 0, x, 0, 0),
        0,
        0,
        0
      );
      this._visibleContainers.push(visibleContainer);

      if (x + container.dx > maxX) {
        maxX = x + container.dx;
      }
      if (container.dy > maxY) {
        maxY = container.dy;
      }
      if (container.dz > maxZ) {
        maxZ = container.dz;
      }

      x += container.dx + this._contants.GRID_SPACING;
      x = x - (x % this._contants.GRID_SPACING);
    });

    return { maxX, maxY, maxZ };
  }

  private addGrid(maxY: number, maxX: number) {
    var size =
      Math.max(maxY, maxX) +
      this._contants.GRID_SPACING +
      this._contants.GRID_SPACING;

    let grid = new THREE.GridHelper(
      size,
      size / this._contants.GRID_SPACING,
      0x42a5f5,
      0x42a5f5
    );

    grid.position.y = 0;
    grid.position.x = size / 2 - this._contants.GRID_SPACING;
    grid.position.z = size / 2 - this._contants.GRID_SPACING;

    this._scene.add(grid);
  }

  private addLight() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this._scene.add(ambientLight);
  }

  //#endregion Models
}
