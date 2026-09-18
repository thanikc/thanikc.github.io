import * as THREE from 'three';
import {
  ScrollSceneDef,
  edgeFade,
  sceneFidelity,
} from '../../../shared/scroll-scene/scroll-scene.component';
import { readThemeColor } from '../../../shared/scroll-scene/theme-color';

/**
 * "The services and delivery behind them": small spheres travelling along a
 * looping path — a pipeline in motion, one geometry concept.
 */
export const servicesScene: ScrollSceneDef = {
  build(): THREE.Object3D {
    const count = sceneFidelity() === 'high' ? 14 : 8;
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.14, 12, 12);
    const material = new THREE.MeshBasicMaterial({
      color: readThemeColor('--mat-sys-tertiary'),
      transparent: true,
    });

    for (let i = 0; i < count; i++) {
      const sphere = new THREE.Mesh(geometry, material);
      sphere.userData['offset'] = i / count;
      group.add(sphere);
    }

    group.userData['material'] = material;
    return group;
  },
  onProgress(t: number, object: THREE.Object3D): void {
    const elapsed = performance.now() / 1000;
    for (const child of object.children) {
      const offset = child.userData['offset'] as number;
      const phase = (elapsed * 0.15 + offset + t) % 1;
      const angle = phase * Math.PI * 2;
      const radius = 0.6 + t * 1.6;
      child.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 2) * (0.2 + t * 0.4),
        Math.sin(angle) * radius,
      );
    }
    object.rotation.y = elapsed * 0.05;
    (object.userData['material'] as THREE.Material).opacity = edgeFade(t);
  },
};
