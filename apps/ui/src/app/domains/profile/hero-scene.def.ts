import * as THREE from 'three';
import { ScrollSceneDef, sceneFidelity } from '../../shared/scroll-scene/scroll-scene.component';
import { readThemeColor } from '../../shared/scroll-scene/theme-color';

/**
 * Hero scene: a wireframe landscape — grid floor rising into hills on both
 * sides, wireframe towers among them, a glowing orb over the valley and
 * drifting dust. Idle/self-animating (driven by elapsed time, not scroll
 * progress): the hero is a single full-bleed opening section, not a
 * multi-screen pinned narrative — that mechanic belongs to the work-theme sections.
 * World lines use the inverse-surface primary (mint), the orb the brand gold.
 */

const FLOOR_Y = -1.6;
const DEPTH = 36;

/** Floor height: flat valley down the middle, bumpy hills from |x| ≈ 2.5 outward. */
function terrainHeight(x: number, z: number): number {
  const edge = Math.min(Math.max((Math.abs(x) - 2.5) / 3.5, 0), 1);
  const bumps = 0.6 + 0.4 * Math.sin(x * 0.8 + z * 0.5) * Math.cos(z * 0.9 - x * 0.3);
  return edge * edge * 2.4 * bumps;
}

/** Quad grid (no triangle diagonals) over the terrain, fading out toward the horizon. */
function terrain(color: THREE.Color, step: number): THREE.LineSegments {
  const positions: number[] = [];
  const colors: number[] = [];
  const point = (x: number, z: number): void => {
    positions.push(x, FLOOR_Y + terrainHeight(x, z), z);
    colors.push(color.r, color.g, color.b, Math.max(0, 1 - (4 - z) / (DEPTH + 4)) * 0.6);
  };
  for (let z = 4; z > -DEPTH; z -= step) {
    for (let x = -14; x < 14; x += step) {
      point(x, z);
      point(x + step, z); // along x
      point(x, z);
      point(x, z - step); // along z
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }),
  );
}

/** [x, z, width, height] — mirrored clusters either side of the valley. */
const TOWERS: [number, number, number, number][] = [
  [-5.2, -13, 1.4, 7],
  [-6.6, -15, 1.1, 5],
  [-4, -16, 1, 4],
  [5.4, -14, 1.3, 6.5],
  [6.8, -12, 1, 4.5],
  [4.2, -17, 1, 3.6],
];

function tower(color: THREE.Color, [x, z, w, h]: (typeof TOWERS)[number]): THREE.Object3D {
  const group = new THREE.Group();
  group.position.set(x, FLOOR_Y + h / 2, z);
  group.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w, 2, Math.round(h * 2), 2),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.2 }),
    ),
    new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.07, depthWrite: false }),
    ),
  );
  return group;
}

/** Wavy latitude bands merged into one draw call, plus additive halo shells for the glow. */
function orb(color: THREE.Color, bands: number, at: THREE.Vector3): THREE.Object3D {
  const radius = 2.4;
  const positions: number[] = [];
  const steps = 96;
  for (let i = 0; i < bands; i++) {
    const base = -1.3 + (2.6 * i) / (bands - 1);
    let prev: number[] | undefined;
    for (let s = 0; s <= steps; s++) {
      const theta = (s / steps) * Math.PI * 2;
      const lat = base + 0.12 * Math.sin(2 * theta + i * 0.5) + 0.04 * Math.sin(5 * theta - i);
      const r = radius * Math.cos(lat);
      const p = [r * Math.cos(theta), radius * Math.sin(lat), r * Math.sin(theta)];
      if (prev) positions.push(...prev, ...p);
      prev = p;
    }
  }
  const bandGeometry = new THREE.BufferGeometry();
  bandGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const additive = {
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  };
  const group = new THREE.Group();
  group.position.copy(at);
  group.add(
    new THREE.LineSegments(
      bandGeometry,
      new THREE.LineBasicMaterial({ ...additive, opacity: 0.5 }),
    ),
    new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.98, 32, 16),
      new THREE.MeshBasicMaterial({ ...additive, opacity: 0.12 }),
    ),
  );
  for (const scale of [1.06, 1.15, 1.26, 1.4]) {
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(radius * scale, 32, 16),
        new THREE.MeshBasicMaterial({ ...additive, opacity: 0.05, side: THREE.BackSide }),
      ),
    );
  }
  return group;
}

function dust(color: THREE.Color, count: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions.set([(Math.random() - 0.5) * 28, Math.random() * 10 - 1, -Math.random() * 30], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color,
      size: 0.07,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

export const heroScene: ScrollSceneDef = {
  build(renderer: THREE.WebGLRenderer): THREE.Object3D {
    const high = sceneFidelity() === 'high';
    const world = readThemeColor('--mat-sys-inverse-primary');
    const glow = readThemeColor('--mat-sys-tertiary-fixed-dim');

    const root = new THREE.Group();
    // The camera looks straight ahead from z=5; tilting the world drops the
    // horizon toward the lower third, leaving the sky behind the hero copy.
    root.rotation.x = -0.15;
    // Off to the right of the copy on wide screens; small and high on phones, where
    // the copy spans the full width (read once: a resize keeps the first placement).
    const wide = window.innerWidth >= 768;
    const sphere = orb(
      glow,
      high ? 28 : 16,
      wide ? new THREE.Vector3(5.5, 4, -12) : new THREE.Vector3(3, 6.5, -14),
    );
    const particles = dust(world, high ? 260 : 110);
    root.add(
      terrain(world, high ? 0.7 : 1),
      sphere,
      particles,
      ...TOWERS.map(t => tower(world, t)),
    );
    root.userData = { sphere, particles };
    return root;
  },
  onProgress(t: number, object: THREE.Object3D): void {
    const elapsed = performance.now() / 1000;
    const { sphere, particles } = object.userData as {
      sphere: THREE.Object3D;
      particles: THREE.Object3D;
    };
    sphere.rotation.y = elapsed * 0.15;
    sphere.rotation.z = 0.35;
    particles.position.y = Math.sin(elapsed * 0.2) * 0.3;
    particles.rotation.y = elapsed * 0.01;
    object.rotation.y = Math.sin(elapsed * 0.08) * 0.04 + t * 0.05;
  },
};
