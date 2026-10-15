import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { toonMat } from './bear.js';

const NAMES = [
  'flowers', 'flower', 'bush_berries', 'bush_flowers', 'grass', 'mushroom',
  'fox', 'rabbit', 'cat2', 'birb', 'frog', 'chicken', 'lilypad',
];

export async function loadModels(onProgress) {
  const loader = new GLTFLoader();
  const out = {};
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i];
    out[name] = await loader.loadAsync(`assets/models/${name}.glb`);
    onProgress((i + 1) / NAMES.length);
  }
  return out;
}

export function findClip(clips, hint) {
  const h = hint.toLowerCase();
  return clips.find((c) => c.name.toLowerCase().split('|').pop() === h)
    || clips.find((c) => c.name.toLowerCase().endsWith(h));
}

/**
 * The packs ship muted, grey-ish colours. For a toddler's game we remap them to bright,
 * saturated, friendly cartoon colours (keyed by the material names in the .glb files).
 */
const PALETTE = {
  // cat
  Cat_Main: 0xffa23d, Cat_Secondary: 0xe0701c, Ears: 0xff8fb3,
  // bird
  Birb_Main: 0x2fa8ff, Birb_Beak: 0xff8a00, Birb_Secondary: 0xfff1b8,
  // frog
  Frog_Main: 0x59d93f, Frog_Secondary: 0xfff08a,
  // fox
  Main: 0xff7a1f, Main_Light: 0xfff6ea, Grey: 0x7a4a2a, Black: 0x3b2a22,
  // chicken
  Chicken_Main: 0xfffaf0, Chicken_Red: 0xff3b3b, Beak: 0xffae00,
  // shared eyes
  Eye_White: 0xffffff, Eye_Black: 0x1c1410, Eyes: 0x1c1410,
};

let gradient = null;

/** Replace a stock material with a bright toon material (same maps, vivid colours). */
function vivid(m) {
  if (!gradient) gradient = toonMat(0xffffff).gradientMap;
  const c = m.color ? m.color.clone() : new THREE.Color(0xffffff);
  const named = PALETTE[m.name];
  if (named !== undefined) {
    c.setHex(named);
  } else if (!m.map) {
    const hsl = {};
    c.getHSL(hsl);
    c.setHSL(hsl.h, Math.min(1, hsl.s * 1.3 + 0.05), Math.min(0.82, hsl.l * 1.18 + 0.03));
  }
  const t = new THREE.MeshToonMaterial({
    color: c,
    map: m.map || null,
    vertexColors: !!m.vertexColors,
    gradientMap: gradient,
    transparent: m.transparent,
    opacity: m.opacity,
    alphaTest: m.alphaTest,
    side: m.side,
  });
  t.name = m.name;
  // Soft self-light so the shaded side of a friend is never murky.
  if (m.map) {
    t.emissive = new THREE.Color(0xffffff);
    t.emissiveMap = m.map;
    t.emissiveIntensity = 0.32;
  } else {
    t.emissive = c.clone().multiplyScalar(0.3);
  }
  return t;
}

/** Clone a glTF, stand it on y=0, and scale it to `height` meters. */
export function spawn(gltf, height) {
  const root = SkeletonUtils.clone(gltf.scene);
  let skinned = false;
  const cache = new Map();
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      const swap = (m) => {
        if (!cache.has(m)) cache.set(m, vivid(m));
        return cache.get(m);
      };
      o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    }
    if (o.isSkinnedMesh) {
      skinned = true;
      o.frustumCulled = false;
    }
  });
  // Skinned rigs often carry their scale on the armature, so measure the posed vertices.
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root, skinned);
  const h = Math.max(0.0001, box.max.y - box.min.y);
  root.scale.multiplyScalar(height / h);
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root, skinned);
  root.position.y -= box2.min.y;
  root.updateMatrixWorld(true);
  awakeEyes(root);
  const mixer = new THREE.AnimationMixer(root);
  return { root, mixer, clips: gltf.animations || [], action: null, busy: false };
}

/**
 * The cat and bird ship with a flat black slit as the "pupil", which reads as sleepy.
 * Hide it and put real glossy pupils (with a sparkle) on the head bone so they follow the animation.
 */
function awakeEyes(root) {
  let white = null;
  let black = null;
  let headBone = null;
  root.traverse((o) => {
    if (o.isBone && /head/i.test(o.name) && !/end|top|eye|ear|jaw/i.test(o.name) && !headBone) headBone = o;
    if (!o.isSkinnedMesh) return;
    const names = [].concat(o.material).map((m) => m.name);
    const n = o.geometry.attributes.position.count;
    if (names.includes('Eye_White') && n === 362) white = o;
    if (names.includes('Eye_Black') && n === 42) black = o;
  });
  if (!white || !black || !headBone) return;
  const pos = white.geometry.attributes.position;
  const pts = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) pts.push(white.localToWorld(v.fromBufferAttribute(pos, i).clone()));
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const bpos = black.geometry.attributes.position;
  const bpts = [];
  for (let i = 0; i < bpos.count; i++) bpts.push(black.localToWorld(v.fromBufferAttribute(bpos, i).clone()));
  const bmx = bpts.reduce((s, p) => s + p.x, 0) / bpts.length;
  const sideOf = (arr, left) => arr.filter((p) => (left ? p.x < mx : p.x >= mx));
  const bleft = bpts.filter((p) => p.x < bmx);
  const bright = bpts.filter((p) => p.x >= bmx);
  [[sideOf(pts, true), bleft], [sideOf(pts, false), bright]].forEach(([cluster, pc]) => {
    if (!cluster.length || !pc.length) return;
    const box = new THREE.Box3().setFromPoints(cluster);
    const sz = box.getSize(new THREE.Vector3());
    const r = Math.max(sz.x, sz.y, sz.z) / 2;
    const pcenter = new THREE.Box3().setFromPoints(pc).getCenter(new THREE.Vector3());
    const hs = headBone.getWorldScale(new THREE.Vector3()).x || 1;
    const inv = headBone.matrixWorld.clone().invert();
    const fwd = new THREE.Vector3(0, 0, 1).transformDirection(inv);
    const up = new THREE.Vector3(0, 1, 0).transformDirection(inv);
    const local = headBone.worldToLocal(pcenter.clone());
    const rl = r / hs;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(rl * 0.5, 12, 10), new THREE.MeshBasicMaterial({ color: 0x140c08 }));
    const rgt = new THREE.Vector3(1, 0, 0).transformDirection(inv);
    const isLeft = pcenter.x < mx;
    pupil.position.copy(local).addScaledVector(fwd, rl * 0.1).addScaledVector(up, rl * 0.32).addScaledVector(rgt, isLeft ? rl * 0.2 : rl * 0.04);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(rl * 0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.copy(pupil.position).addScaledVector(fwd, rl * 0.42).addScaledVector(up, rl * 0.26);
    headBone.add(pupil, glint);
  });
  black.visible = false;
}

export function playLoop(actor, hint) {
  const clip = findClip(actor.clips, hint);
  if (!clip) return false;
  const next = actor.mixer.clipAction(clip);
  if (actor.action === next && next.isRunning()) return true;
  next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.18).play();
  if (actor.action && actor.action !== next) actor.action.fadeOut(0.18);
  actor.action = next;
  actor.busy = false;
  return true;
}

export function playOnce(actor, hint, thenHint) {
  const clip = findClip(actor.clips, hint);
  if (!clip) {
    playLoop(actor, thenHint || 'idle');
    return;
  }
  const next = actor.mixer.clipAction(clip);
  next.reset().setLoop(THREE.LoopOnce, 1);
  next.clampWhenFinished = true;
  next.fadeIn(0.1).play();
  if (actor.action && actor.action !== next) actor.action.fadeOut(0.1);
  actor.action = next;
  actor.busy = true;
  const onDone = (e) => {
    if (e.action !== next) return;
    actor.mixer.removeEventListener('finished', onDone);
    actor.busy = false;
    playLoop(actor, thenHint || 'idle');
  };
  actor.mixer.addEventListener('finished', onDone);
}

export function greet(actor) {
  if (actor.busy) return;
  if (findClip(actor.clips, 'wave')) playOnce(actor, 'wave', 'idle');
  else if (findClip(actor.clips, 'yes')) playOnce(actor, 'yes', 'idle');
  else if (findClip(actor.clips, 'dance')) playOnce(actor, 'dance', 'idle');
  else if (findClip(actor.clips, 'jump')) playOnce(actor, 'jump', 'idle');
  else playLoop(actor, 'idle');
}
