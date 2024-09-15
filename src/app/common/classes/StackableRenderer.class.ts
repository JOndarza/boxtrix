import { BoxGeometry, Object3D } from 'three';
import * as THREE from 'three';

import { Box } from './Box.class';
import { ColorScheme } from '../interfaces/ColorScheme';
import { Container } from './Container.class';
import { StackPlacement } from './StackPlacement.class';

export class StackableRenderer {
  add(
    parent: Object3D,
    colorScheme: ColorScheme,
    stackPlacement: StackPlacement,
    x: number,
    y: number,
    z: number
  ): Object3D | undefined {
    var stackable = stackPlacement.stackable;

    if (stackable instanceof Container) {
      var containerStackable: Container = stackable;

      var color = colorScheme.getStackable(containerStackable);
      var containerMaterial = new THREE.LineBasicMaterial({ color: color });

      var containerGeometry = new THREE.EdgesGeometry(
        new BoxGeometry(
          containerStackable.dy,
          containerStackable.dz,
          containerStackable.dx
        )
      );
      var containerLoadGeometry = new THREE.EdgesGeometry(
        new BoxGeometry(
          containerStackable.loadDy,
          containerStackable.loadDz,
          containerStackable.loadDx
        )
      );

      var container = new THREE.LineSegments(
        containerGeometry,
        containerMaterial
      );
      var containerLoad = new THREE.LineSegments(
        containerLoadGeometry,
        containerMaterial
      );

      container.position.x = stackPlacement.y + containerStackable.dy / 2 + x;
      container.position.y = stackPlacement.z + containerStackable.dz / 2 + y;
      container.position.z = stackPlacement.x + containerStackable.dx / 2 + z;

      var offsetX = -containerStackable.dy / 2;
      var offsetY = -containerStackable.dz / 2;
      var offsetZ = -containerStackable.dx / 2;

      console.log(
        `Add container ${containerStackable.name} size ${containerStackable.dx}x${containerStackable.dy}x${containerStackable.dz} with load ${containerStackable.loadDx}x${containerStackable.loadDy}x${containerStackable.loadDz} at ${stackPlacement.x}x${stackPlacement.y}x${stackPlacement.z}`
      );

      container.name = containerStackable.name;
      container.userData = containerStackable;

      container.userData = {
        step: 0,
        type: 'container',
        source: container,
      };

      containerLoad.name = containerStackable.name;
      containerLoad.userData = {
        step: 0,
        type: 'containerLoad',
        offsetX: offsetX,
        offsetY: offsetY,
        offsetZ: offsetZ,
      };

      parent.add(container);
      container.add(containerLoad);

      var nextColorScheme = colorScheme.getColorScheme(containerStackable);
      for (let s of containerStackable.stack.placements) {
        this.add(containerLoad, nextColorScheme, s, offsetX, offsetY, offsetZ);
      }

      return container;
    } else if (stackable instanceof Box) {
      var boxStackable: Box = stackable;

      console.log(
        'Add box ' +
          boxStackable.name +
          ' size ' +
          boxStackable.dx +
          'x' +
          boxStackable.dy +
          'x' +
          boxStackable.dz +
          ' at ' +
          stackPlacement.x +
          'x' +
          stackPlacement.y +
          'x' +
          stackPlacement.z
      );

      var sColor = colorScheme.getStackable(boxStackable);

      var material = new THREE.MeshStandardMaterial({
        color: sColor,
        opacity: 0.7,
        metalness: 0.2,
        roughness: 1,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      material.color.convertSRGBToLinear();

      var geometry = new BoxGeometry(
        boxStackable.dy,
        boxStackable.dz,
        boxStackable.dx
      );
      var box = new THREE.Mesh(geometry, material);

      box.name = boxStackable.name;
      box.uuid = boxStackable.id;
      box.position.x = stackPlacement.y + boxStackable.dy / 2 + x;
      box.position.y = stackPlacement.z + boxStackable.dz / 2 + y;
      box.position.z = stackPlacement.x + boxStackable.dx / 2 + z;

      box.userData = {
        step: boxStackable.step,
        type: 'box',
        source: stackPlacement,
      };

      parent.add(box);

      return box;
    }
    return undefined;
  }

  removePoints(container: Object3D) {
    var children = container.children;
    for (var j = 0; j < children.length; j++) {
      var userData = children[j].userData;

      if (userData['type'] == 'containerLoad') {
        var containerLoad = children[j];
        var containerLoadChildren = containerLoad.children;

        for (var i = containerLoadChildren.length - 1; i >= 0; i--) {
          var child = containerLoadChildren[i];
          var userData = child.userData;

          if (userData['type'] == 'point') {
            containerLoad.remove(child);
          }
        }
      }
    }
  }

  addPoints(container: Object3D, colorScheme: ColorScheme, stepNumber: number) {
    var children = container.children;
    for (var j = 0; j < children.length; j++) {
      var userData = children[j].userData;

      if (userData['type'] == 'containerLoad') {
        var containerLoad = children[j];
        var containerLoadChildren = containerLoad.children;

        for (var i = 0; i < containerLoadChildren.length; i++) {
          var child = containerLoadChildren[i];

          var containerLoadChildUserData = child.userData;

          if (
            containerLoadChildUserData['type'] == 'box' &&
            containerLoadChildUserData['step'] == stepNumber - 1
          ) {
            for (let p of containerLoadChildUserData['source'].points) {
              var color = colorScheme.getPoint(p);

              var pointMaterial = new THREE.LineBasicMaterial({ color: color });
              pointMaterial.color.convertSRGBToLinear();
              var containerGeometry = new THREE.EdgesGeometry(
                new BoxGeometry(p.dy, p.dz, p.dx)
              );
              var pp = new THREE.LineSegments(containerGeometry, pointMaterial);

              pp.position.x = p.y + p.dy / 2 + userData['offsetX'];
              pp.position.y = p.z + p.dz / 2 + userData['offsetY'];
              pp.position.z = p.x + p.dx / 2 + userData['offsetZ'];

              pp.userData = {
                type: 'point',
              };

              pp.visible = true;

              containerLoad.add(pp);
            }
            break;
          }
        }
      }
    }
  }
}
