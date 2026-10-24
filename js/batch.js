import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
 * Static batching. The garden is built from ~2,000 small meshes (every tree is a dozen blobs),
 * which costs a tablet one draw call each. After the world is built, every mesh that never moves
 * is merged with the others that share its material and its 32 m patch of ground, so the GPU gets
 * a few dozen big meshes instead.
 *
 * What stays untouched: anything reachable from `dynamicRoots` (items, animals, toys, sky, guide…),
 * everything already in the scene before the world was built, meshes with children, skinned /
 * instanced meshes, hidden meshes and transparent materials.
 *
 * The originals are only hidden, not removed: the camera still raycasts against them
 * (Raycaster ignores `visible`) so it keeps sliding in front of trees and houses.
 */
const CELL = 32;

/** Collect every Object3D found in the given values (arrays / plain objects, a few levels deep). */
function collectObjects(values, out, depth = 0) {
  if (!values || depth > 7) return;
  if (values.isObject3D) { out.add(values); return; }
  if (Array.isArray(values)) { values.forEach((v) => collectObjects(v, out, depth + 1)); return; }
  if (typeof values === 'object' && values.constructor === Object) {
    Object.values(values).forEach((v) => collectObjects(v, out, depth + 1));
  }
}

/** Materials that look the same can share one batch even when they are separate objects. */
function lookKey(m) {
  const hex = (c) => (c ? c.getHexString() : '-');
  const tex = (t) => (t ? t.uuid : '-');
  return [m.type, hex(m.color), hex(m.emissive), m.emissiveIntensity, tex(m.map), tex(m.emissiveMap),
    tex(m.gradientMap), m.side, m.flatShading ? 1 : 0, m.vertexColors ? 1 : 0, m.fog ? 1 : 0].join(':');
}

function attrsFor(material) {
  const need = ['position', 'normal'];
  if (material.map || material.emissiveMap) need.push('uv');
  if (material.vertexColors) need.push('color');
  return need;
}

/** World-space, non-indexed copy holding only the attributes the material needs. */
function bakedGeometry(mesh, need, matrix = mesh.matrixWorld) {
  let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  if (!g.attributes.normal) g.computeVertexNormals();
  for (const name of need) if (!g.attributes[name]) return null;
  for (const name of Object.keys(g.attributes)) if (!need.includes(name)) g.deleteAttribute(name);
  g.morphAttributes = {};
  g.clearGroups();
  g.applyMatrix4(matrix);
  if (matrix.determinant() < 0) {
    // A mirrored transform flips the triangle winding; swap two corners to keep faces outward.
    Object.values(g.attributes).forEach((a) => {
      const s = a.itemSize;
      for (let t = 0; t < a.count; t += 3) {
        for (let k = 0; k < s; k++) {
          const i1 = (t + 1) * s + k;
          const i2 = (t + 2) * s + k;
          const tmp = a.array[i1];
          a.array[i1] = a.array[i2];
          a.array[i2] = tmp;
        }
      }
    });
  }
  return g;
}

/**
 * Rigid batching: a group that moves only as a whole (the drifting clouds, the sky decor that
 * follows the camera, one flower or coin) gets its parts merged in its own local space. The
 * merged mesh is added to the group, so the group keeps moving, turning and hiding as before.
 * @returns number of meshes merged away
 */
export function batchRigid(group) {
  group.updateMatrixWorld(true);
  const toLocal = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const groups = new Map();
  group.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.children.length || Array.isArray(o.material)) return;
    const m = o.material;
    if (!m || m.transparent || m.isShaderMaterial) return;
    for (let p = o; p && p !== group; p = p.parent) if (!p.visible) return;
    const key = `${lookKey(m)}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}`;
    if (!groups.has(key)) groups.set(key, { material: m, cast: o.castShadow, receive: o.receiveShadow, meshes: [] });
    groups.get(key).meshes.push(o);
  });
  let merged = 0;
  const local = new THREE.Matrix4();
  groups.forEach((grp) => {
    if (grp.meshes.length < 2) return;
    const need = attrsFor(grp.material);
    const parts = [];
    const used = [];
    grp.meshes.forEach((o) => {
      const g = bakedGeometry(o, need, local.multiplyMatrices(toLocal, o.matrixWorld));
      if (g) { parts.push(g); used.push(o); }
    });
    if (parts.length < 2) return;
    const geo = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    if (!geo) return;
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, grp.material);
    mesh.castShadow = grp.cast;
    mesh.receiveShadow = grp.receive;
    mesh.name = 'rigid-batch';
    group.add(mesh);
    used.forEach((o) => { o.visible = false; });
    merged += used.length - 1;
  });
  return merged;
}

/**
 * @param scene the scene
 * @param dynamicRoots objects (or containers of objects) that move, change or are hidden later
 * @param keep scene children that existed before the world was built
 * @returns { meshesBefore, batches }
 */
export function batchStatic(scene, dynamicRoots, keep) {
  scene.updateMatrixWorld(true);
  const roots = new Set();
  collectObjects(dynamicRoots, roots);
  keep.forEach((o) => roots.add(o));
  const dynamic = new Set();
  roots.forEach((r) => r.traverse((o) => dynamic.add(o)));

  const groups = new Map();
  let candidates = 0;
  scene.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || dynamic.has(o)) return;
    if (o.children.length || Array.isArray(o.material)) return;
    const m = o.material;
    if (!m || m.transparent || m.isShaderMaterial) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    const pos = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const key = `${lookKey(m)}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${Math.floor(pos.x / CELL)},${Math.floor(pos.z / CELL)}`;
    if (!groups.has(key)) groups.set(key, { material: m, cast: o.castShadow, receive: o.receiveShadow, meshes: [] });
    groups.get(key).meshes.push(o);
    candidates++;
  });

  let batches = 0;
  groups.forEach((grp) => {
    if (grp.meshes.length < 2) return;
    const need = attrsFor(grp.material);
    const parts = [];
    const used = [];
    grp.meshes.forEach((o) => {
      const g = bakedGeometry(o, need);
      if (g) { parts.push(g); used.push(o); }
    });
    if (parts.length < 2) return;
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    if (!merged) return;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, grp.material);
    mesh.castShadow = grp.cast;
    mesh.receiveShadow = grp.receive;
    mesh.matrixAutoUpdate = false;
    mesh.name = 'static-batch';
    scene.add(mesh);
    used.forEach((o) => { o.visible = false; });
    batches++;
  });
  return { candidates, batches };
}
