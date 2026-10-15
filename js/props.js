import * as THREE from 'three';
import { toonMat } from './bear.js';

export const rnd = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const mats = new Map();
export function mat(color, flat) {
  const key = `${color}-${flat ? 1 : 0}`;
  if (!mats.has(key)) {
    const m = toonMat(color);
    if (flat) m.flatShading = true;
    mats.set(key, m);
  }
  return mats.get(key);
}

const BLOB = new THREE.IcosahedronGeometry(1, 2);
const ROCK = new THREE.IcosahedronGeometry(1, 0);
const TRUNK = new THREE.CylinderGeometry(0.7, 1, 1, 8);
const CONE = new THREE.ConeGeometry(1, 1, 9);

function add(parent, geo, color, x, y, z, sx, sy, sz, flat) {
  const m = new THREE.Mesh(geo, mat(color, flat));
  m.position.set(x, y, z);
  m.scale.set(sx, sy ?? sx, sz ?? sx);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const GREENS = [0x5cb85c, 0x6cc24a, 0x4caf50, 0x7cc95a];

/** Round toon tree; canopy sits high so hanging fruit stays visible. */
export function roundTree(h, seed, blossom) {
  const g = new THREE.Group();
  add(g, TRUNK, 0x8d5a3b, 0, h * 0.3, 0, h * 0.07, h * 0.6, h * 0.07);
  const base = blossom ? [0xf8a5c2, 0xf48fb1, 0xfbc2d6] : GREENS;
  const c0 = base[Math.floor(rnd(seed) * base.length)];
  const c1 = base[Math.floor(rnd(seed + 1) * base.length)];
  add(g, BLOB, c0, 0, h * 0.7, 0, h * 0.25);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rnd(seed + i) * 0.8;
    add(g, BLOB, i % 2 ? c1 : c0, Math.cos(a) * h * 0.2, h * (0.6 + rnd(seed + 9 + i) * 0.1), Math.sin(a) * h * 0.2, h * 0.18);
  }
  add(g, BLOB, blossom ? 0xfde4ee : 0x9ad66b, -h * 0.06, h * 0.86, h * 0.05, h * 0.12);
  return g;
}

export function pineTree(h, seed) {
  const g = new THREE.Group();
  add(g, TRUNK, 0x7a4b2c, 0, h * 0.12, 0, h * 0.06, h * 0.24, h * 0.06);
  const c = rnd(seed) > 0.5 ? 0x2f9e6a : 0x3aa76d;
  [[0.32, 0.38, 0.34], [0.25, 0.32, 0.56], [0.17, 0.26, 0.76]].forEach(([r, hh, y]) => {
    add(g, CONE, c, 0, h * y, 0, h * r, h * hh, h * r);
  });
  add(g, BLOB, 0xfff59d, 0, h * 0.92, 0, h * 0.035);
  return g;
}

export function birchTree(h, seed) {
  const g = new THREE.Group();
  add(g, TRUNK, 0xf5f2ea, 0, h * 0.32, 0, h * 0.05, h * 0.64, h * 0.05);
  for (let i = 0; i < 4; i++) add(g, TRUNK, 0x4e4a46, 0, h * (0.12 + i * 0.12), 0, h * 0.052, h * 0.015, h * 0.052);
  const cs = [0xb5d334, 0x9ccc65, 0xc5e1a5];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rnd(seed + i);
    const r = i === 0 ? 0 : h * 0.13;
    add(g, BLOB, cs[i % 3], Math.cos(a) * r, h * (0.68 + rnd(seed + 5 + i) * 0.14), Math.sin(a) * r, h * 0.15);
  }
  return g;
}

/** Short leaning palm for the banana trees. */
export function palmTree(h, seed) {
  const g = new THREE.Group();
  let x = 0;
  for (let i = 0; i < 6; i++) {
    x += 0.05 * h;
    add(g, TRUNK, i % 2 ? 0xc49a6c : 0xb0855a, x, h * (0.08 + i * 0.15), 0, h * 0.06, h * 0.16, h * 0.06);
  }
  const top = new THREE.Group();
  top.position.set(x, h * 0.95, 0);
  g.add(top);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd(seed);
    const leaf = new THREE.Group();
    leaf.rotation.y = a;
    top.add(leaf);
    const l = add(leaf, BLOB, i % 2 ? 0x43a047 : 0x66bb6a, h * 0.32, -h * 0.08, 0, h * 0.34, h * 0.035, h * 0.1);
    l.rotation.z = -0.35;
  }
  add(top, BLOB, 0x8d6e63, 0, -h * 0.04, 0, h * 0.07);
  return g;
}

export function rock(size, seed, color) {
  const g = new THREE.Group();
  const c = color ?? (rnd(seed) > 0.5 ? 0xb8b0c8 : 0xc9bfa8);
  const m = add(g, ROCK, c, 0, size * 0.35, 0, size * 0.6, size * 0.42, size * 0.5, true);
  m.rotation.set(rnd(seed + 1), rnd(seed + 2) * 3, rnd(seed + 3));
  if (size > 0.8) {
    const s = add(g, ROCK, c, size * 0.45, size * 0.18, size * 0.2, size * 0.3, size * 0.22, size * 0.28, true);
    s.rotation.y = rnd(seed + 4) * 3;
  }
  return g;
}

export function cloud(seed) {
  const g = new THREE.Group();
  const m = toonMat(0xffffff);
  m.fog = false;
  const n = 4 + Math.floor(rnd(seed) * 3);
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(BLOB, m);
    const r = 2.2 + rnd(seed + i) * 2;
    s.scale.set(r, r * 0.7, r);
    s.position.set((i - n / 2) * 2.4, rnd(seed + 10 + i) * 1.2, rnd(seed + 20 + i) * 2 - 1);
    g.add(s);
  }
  return g;
}

/** Five-pointed star outline for coins and signs. */
export function starShape(outer, inner) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
