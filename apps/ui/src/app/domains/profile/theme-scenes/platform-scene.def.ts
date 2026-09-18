import * as THREE from 'three';
import {
  ScrollSceneDef,
  edgeFade,
  sceneFidelity,
} from '../../../shared/scroll-scene/scroll-scene.component';
import { readThemeColor } from '../../../shared/scroll-scene/theme-color';

/**
 * "A shared platform, not one app": an interlocking grid of wireframe cubes —
 * many separate cells sharing one lattice, one geometry concept. The single shared material is stashed on the group's
 * `userData` so `onProgress` can fade it without re-walking the tree.
 */
export const platformScene: ScrollSceneDef = {
  build(): THREE.Object3D {
    const side = sceneFidelity() === 'high' ? 4 : 3;
    const spacing = 1.1;
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const material = new THREE.MeshBasicMaterial({
      color: readThemeColor('--mat-sys-tertiary'),
      wireframe: true,
      transparent: true,
    });

    const offset = ((side - 1) * spacing) / 2;
    for (let x = 0; x < side; x++) {
      for (let y = 0; y < side; y++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.userData['grid'] = [x * spacing - offset, y * spacing - offset];
        cube.userData['seed'] = Math.sin((x * side + y + 1) * 12.9898);
        group.add(cube);
      }
    }

    group.userData['material'] = material;
    return group;
  },
  onProgress(t: number, object: THREE.Object3D): void {
    const elapsed = performance.now() / 1000;
    // Scroll-driven: cells start exploded and scattered in depth, then lock
    // into the shared lattice by ~70% of the section, so scrolling always
    // visibly moves something.
    const scatter = 1 - Math.min(1, t / 0.7);
    for (const cube of object.children) {
      const [gx, gy] = cube.userData['grid'] as [number, number];
      const seed = cube.userData['seed'] as number;
      cube.position.set(gx * (1 + scatter * 1.2), gy * (1 + scatter * 1.2), seed * scatter * 3);
    }
    object.rotation.y = elapsed * 0.1 + t * Math.PI;
    object.rotation.x = Math.sin(elapsed * 0.2) * 0.15;
    (object.userData['material'] as THREE.Material).opacity = edgeFade(t);
  },
};
