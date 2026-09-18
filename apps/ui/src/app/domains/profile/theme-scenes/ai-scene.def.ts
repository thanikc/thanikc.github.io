import * as THREE from 'three';
import {
  ScrollSceneDef,
  edgeFade,
  sceneFidelity,
} from '../../../shared/scroll-scene/scroll-scene.component';
import { readThemeColor } from '../../../shared/scroll-scene/theme-color';

/**
 * "AI in a team's workflow": smaller nodes orbiting and converging toward a
 * central core — assistance meeting the team's own standard, not replacing
 * it, one geometry concept.
 */
export const aiScene: ScrollSceneDef = {
  build(): THREE.Object3D {
    const satellites = sceneFidelity() === 'high' ? 6 : 4;
    const group = new THREE.Group();
    const color = readThemeColor('--mat-sys-tertiary');

    const coreMaterial = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), coreMaterial);
    group.add(core);

    const satelliteMaterial = new THREE.MeshBasicMaterial({ color, transparent: true });
    const satelliteGeometry = new THREE.SphereGeometry(0.12, 10, 10);
    for (let i = 0; i < satellites; i++) {
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      satellite.userData['offset'] = i / satellites;
      group.add(satellite);
    }

    group.userData['materials'] = [coreMaterial, satelliteMaterial];
    return group;
  },
  onProgress(t: number, object: THREE.Object3D): void {
    const elapsed = performance.now() / 1000;
    // Converge from a wide orbit toward the core as the section's own
    // progress advances — "convergence", not a fixed decoration.
    const radius = 2.6 - t * 1.7;

    for (const child of object.children.slice(1)) {
      const offset = child.userData['offset'] as number;
      const angle = elapsed * 0.4 + offset * Math.PI * 2;
      child.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.3) * 0.4,
        Math.sin(angle) * radius,
      );
    }
    object.children[0].rotation.y = elapsed * 0.2 + t * Math.PI * 2;
    object.children[0].scale.setScalar(0.7 + t * 0.9);

    const opacity = edgeFade(t);
    for (const material of object.userData['materials'] as THREE.Material[]) {
      material.opacity = opacity;
    }
  },
};
