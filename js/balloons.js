import * as THREE from 'three';
import { toonMat } from './bear.js';
import { COLORS } from './lines.js';
import { freeSpot, isFree } from './spots.js';

/*
 * Balloon Festival (chapter 4). A small pool of balloons is placed around the bear for each task.
 * The bear pops one by walking into it (low ones) or jumping (high ones).
 */
const POOL = 12; // up to 7 on the ground plus the ones still drifting away
const R = 0.5;

export function makeBalloons(scene) {
  const body = new THREE.SphereGeometry(R, 20, 16);
  body.scale(1, 1.18, 1);
  const knot = new THREE.ConeGeometry(0.09, 0.14, 8);
  const string = new THREE.CylinderGeometry(0.012, 0.012, 1.15, 4);
  const stringMat = toonMat(0x9e9e9e);
  const list = [];
  for (let i = 0; i < POOL; i++) {
    const g = new THREE.Group();
    const mat = toonMat(0xffffff);
    const ball = new THREE.Mesh(body, mat);
    ball.castShadow = true;
    g.add(ball);
    const k = new THREE.Mesh(knot, mat);
    k.position.y = -R * 1.18 - 0.03;
    k.rotation.x = Math.PI;
    g.add(k);
    const s = new THREE.Mesh(string, stringMat);
    s.position.y = -R * 1.18 - 0.6;
    g.add(s);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    shine.position.set(-0.17, 0.25, 0.32);
    g.add(shine);
    g.visible = false;
    scene.add(g);
    list.push({ group: g, mat, x: 0, z: 0, y: 0, base: 0, word: '', alive: false, pop: 0, fly: 0, phase: i * 1.3 });
  }
  return { list, onPop: () => {} };
}

function show(b, word, spot, base) {
  b.word = word;
  b.mat.color.setHex(COLORS[word]);
  b.x = spot.x;
  b.z = spot.z;
  b.base = base;
  b.y = base;
  b.alive = true;
  b.pop = 0;
  b.fly = 0;
  b.group.scale.setScalar(0.01);
  b.group.visible = true;
}

/** Last resort: walk round a circle until a spot is free (or keep the bear's own spot). */
function fallbackSpot(world, from, i) {
  for (let k = 0; k < 24; k++) {
    const a = i * 1.7 + k * 0.6;
    const r = 2.5 + (k % 4);
    const s = { x: from.x + Math.cos(a) * r, z: from.z + Math.sin(a) * r };
    if (isFree(world, s.x, s.z, 0.4)) return s;
  }
  return { x: from.x, z: from.z };
}

/** Balloons in the given colours, spread out 3–9 m around `from`. */
export function placeBalloons(set, world, from, words) {
  set.list.forEach((b) => { if (b.alive) { b.alive = false; b.group.visible = false; } });
  const taken = [];
  // Balloons drifting up from the last task keep flying; new ones come from the free part of the pool.
  const free = set.list.filter((b) => !b.group.visible);
  words.slice(0, free.length).forEach((word, i) => {
    const spot = freeSpot(world, from, 3, 9, 0.9, taken, 2.2)
      || freeSpot(world, from, 2, 12, 0.6, taken, 1.6)
      || fallbackSpot(world, from, i);
    taken.push(spot);
    // Some float low enough to walk into, some need a jump.
    show(free[i], word, spot, 1.5 + Math.random() * 1.1);
  });
}

/** One more balloon somewhere near `from` (replaces a popped one). */
export function addBalloon(set, world, from, word) {
  const b = set.list.find((q) => !q.alive && !q.group.visible);
  if (!b) return;
  const others = set.list.filter((q) => q.alive);
  const spot = freeSpot(world, from, 3, 9, 0.9, others, 2.2) || fallbackSpot(world, from, others.length);
  show(b, word, spot, 1.5 + Math.random() * 1.1);
}

/** The task is over: the balloons that are left drift up into the sky. */
export function releaseBalloons(set) {
  set.list.forEach((b) => { if (b.alive) { b.alive = false; b.fly = 0.001; } });
}

export function aliveBalloons(set) {
  return set.list.filter((b) => b.alive);
}

export function tickBalloons(set, dt, time, pl) {
  set.list.forEach((b) => {
    if (!b.group.visible) return;
    const g = b.group;
    if (b.pop > 0) {
      // Pop: a quick swell, then gone.
      b.pop += dt;
      g.scale.setScalar(1 + b.pop * 4);
      if (b.pop > 0.12) g.visible = false;
      return;
    }
    if (b.fly > 0) {
      b.fly += dt;
      b.y += dt * (1.5 + b.fly);
      g.position.y = b.y;
      if (b.fly > 4) g.visible = false;
      return;
    }
    if (g.scale.x < 1) g.scale.setScalar(Math.min(1, g.scale.x + dt * 3));
    b.y = b.base + Math.sin(time * 1.3 + b.phase) * 0.15;
    g.position.set(b.x, b.y, b.z);
    g.rotation.z = Math.sin(time * 0.9 + b.phase) * 0.08;
    if (!b.alive) return;
    // The bear is ~1.7 m tall: low balloons pop by walking into them, high ones need a jump.
    const near = Math.hypot(pl.x - b.x, pl.z - b.z) < 0.9;
    if (near && pl.y + 1.75 > b.y - R && pl.y < b.y + R) {
      b.alive = false;
      b.pop = 0.001;
      set.onPop(b);
    }
  });
}
