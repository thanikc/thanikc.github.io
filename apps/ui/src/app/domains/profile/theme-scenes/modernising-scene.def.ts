import * as THREE from 'three';
import {
  ScrollSceneDef,
  edgeFade,
  sceneFidelity,
} from '../../../shared/scroll-scene/scroll-scene.component';
import { readThemeColor } from '../../../shared/scroll-scene/theme-color';

/**
 * "Modernising systems that are already live": a wireframe sphere whose
 * vertices displace along a travelling wave — rebuilding a structure while
 * it keeps its overall shape, never fully static, never fully torn down.
 */
export const modernisingScene: ScrollSceneDef = {
  build(): THREE.Object3D {
    const detail = sceneFidelity() === 'high' ? 3 : 2;
    const geometry = new THREE.IcosahedronGeometry(1.6, detail);
    const basePositions = geometry.attributes['position'].array.slice();

    const material = new THREE.MeshBasicMaterial({
      color: readThemeColor('--mat-sys-tertiary'),
      wireframe: true,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData['material'] = material;
    mesh.userData['basePositions'] = basePositions;
    return mesh;
  },
  onProgress(t: number, object: THREE.Object3D): void {
    const mesh = object as THREE.Mesh;
    const geometry = mesh.geometry;
    const base = mesh.userData['basePositions'] as Float32Array;
    const position = geometry.attributes['position'];
    const elapsed = performance.now() / 1000;

    for (let i = 0; i < position.count; i++) {
      const ix = i * 3;
      const x = base[ix];
      const y = base[ix + 1];
      const z = base[ix + 2];
      const wave = 1 + (0.06 + 0.3 * t) * Math.sin(elapsed * 1.5 + x * 2 + y * 2);
      position.setXYZ(i, x * wave, y * wave, z * wave);
    }
    position.needsUpdate = true;

    mesh.rotation.y = elapsed * 0.15 + t * Math.PI * 2;
    (mesh.userData['material'] as THREE.Material).opacity = edgeFade(t);
  },
};
