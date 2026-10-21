import * as THREE from 'three';
import { mat } from './props.js';
import { playLoop } from './assets.js';
import { placeAnimal } from './world.js';

/*
 * Hide and Seek (chapter 5). An animal crouches inside a round bush and peeks out now and then
 * (more often when the bear is close). Walking up to the bush finds it: it hops out and the bush
 * shrinks away; a few seconds later it goes back to its usual walk.
 */
const HEIGHT = { rabbit: 1.05, bird: 0.55, fox: 0.85, chicken: 0.7 };
const BLOB = new THREE.IcosahedronGeometry(1, 1);

export function makeHideBush(scene) {
  const g = new THREE.Group();
  const greens = [0x43a047, 0x4caf50, 0x66bb6a, 0x388e3c];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const m = new THREE.Mesh(BLOB, mat(greens[i % greens.length]));
    m.position.set(Math.cos(a) * 0.62, 0.42 + (i % 2) * 0.1, Math.sin(a) * 0.62);
    m.scale.setScalar(0.48 + (i % 3) * 0.05);
    m.castShadow = true;
    g.add(m);
  }
  const flowerCols = [0xff8fab, 0xfff176, 0xffffff];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const f = new THREE.Mesh(BLOB, mat(flowerCols[i % 3]));
    f.position.set(Math.cos(a) * 0.95, 0.55 + (i % 2) * 0.25, Math.sin(a) * 0.95);
    f.scale.setScalar(0.07);
    g.add(f);
  }
  g.visible = false;
  scene.add(g);
  return { group: g, an: null, x: 0, z: 0, size: 1, out: 0 };
}

/** Hide `an` in the bush at `spot`. */
export function hideAnimal(bush, an, spot, pl) {
  if (bush.an && bush.an !== an) restore(bush.an);
  const h = HEIGHT[an.word] || 0.8;
  if (!an.saved) an.saved = { wander: an.wander, wi: an.wi };
  an.wander = null;
  playLoop(an.actor, 'idle');
  placeAnimal(an, spot.x, spot.z, pl.x, pl.z);
  an.hide = { h, state: 'hidden', t: 0, cycle: Math.random() * 2 };
  bush.an = an;
  bush.x = spot.x;
  bush.z = spot.z;
  bush.size = 0.65 + h * 0.6;
  bush.out = 0;
  bush.group.position.set(spot.x, 0, spot.z);
  bush.group.scale.setScalar(bush.size);
  bush.group.visible = true;
}

/** The bear found it: hop out. */
export function revealAnimal(bush) {
  if (!bush.an || !bush.an.hide) return;
  bush.an.hide.state = 'out';
  bush.an.hide.t = 0;
}

function restore(an) {
  an.actor.root.position.y = an.y;
  an.actor.root.scale.y = an.actor.root.scale.x;
  if (an.saved) {
    an.wander = an.saved.wander;
    an.wi = an.saved.wi || 0;
    an.saved = null;
  }
  an.hide = null;
}

export function tickHide(bush, dt, time, pl) {
  const an = bush.an;
  if (!an || !an.hide) return;
  const hd = an.hide;
  const root = an.actor.root;
  hd.t += dt;
  if (hd.state === 'hidden') {
    // Peekaboo: rise up so the head shows over the bush, look around, duck again.
    const close = Math.hypot(pl.x - bush.x, pl.z - bush.z) < 9;
    hd.cycle += dt * (close ? 1.7 : 1);
    const c = hd.cycle % 3.2;
    const up = c < 1.1 ? Math.sin((c / 1.1) * Math.PI) : 0;
    root.position.y = an.y - hd.h * 0.8 + up * hd.h * 0.7;
    if (up > 0.2) root.rotation.y = Math.atan2(pl.x - an.x, pl.z - an.z) + Math.sin(time * 3) * 0.4;
    // The leaves rustle while someone moves inside.
    bush.group.rotation.z = Math.sin(time * 18) * 0.04 * up;
    bush.group.scale.set(bush.size * (1 + up * 0.04), bush.size * (1 - up * 0.03), bush.size * (1 + up * 0.04));
    return;
  }
  // Found: a big happy hop out of the bush, which then shrinks away.
  const hop = hd.t < 0.6 ? Math.sin((hd.t / 0.6) * Math.PI) * 0.9 : 0;
  const rise = Math.min(1, hd.t / 0.3);
  root.position.y = an.y - hd.h * 0.8 * (1 - rise) + hop;
  root.rotation.y = Math.atan2(pl.x - an.x, pl.z - an.z);
  const s = Math.max(0, 1 - Math.max(0, hd.t - 0.4) * 2.2);
  bush.group.scale.setScalar(bush.size * s);
  bush.group.rotation.z = 0;
  if (s <= 0) bush.group.visible = false;
  if (hd.t > 4) {
    restore(an);
    bush.an = null;
  }
}
