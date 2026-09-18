import * as THREE from 'three';
import { ScrollSceneDef, sceneFidelity } from '../../shared/scroll-scene/scroll-scene.component';
import { readThemeColor } from '../../shared/scroll-scene/theme-color';

/**
 * Hero scene: an evolving wireframe structure — an abstract metaphor for
 * "architecture taking shape" (the portfolio's systems/platform framing),
 * not a literal object. Idle/self-animating
 * (driven by elapsed time, not scroll progress): the hero is a single
 * full-bleed opening section, not a multi-screen pinned narrative — that
 * mechanic belongs to the work-theme sections.
 */
export const heroScene: ScrollSceneDef = {
  build(renderer: THREE.WebGLRenderer): THREE.Object3D {
    const detail = sceneFidelity() === 'high' ? 2 : 1;
    const geometry = new THREE.IcosahedronGeometry(1.7, detail);
    const material = new THREE.MeshBasicMaterial({
      color: readThemeColor('--mat-sys-tertiary'),
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });

    return new THREE.Mesh(geometry, material);
  },
  onProgress(t: number, object: THREE.Object3D): void {
    const elapsed = performance.now() / 1000;
    object.rotation.y = elapsed * 0.12;
    object.rotation.x = elapsed * 0.07 + t * 0.4;
  },
};
