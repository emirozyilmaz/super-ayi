import * as THREE from 'three';
import { S, G, PL, IN } from './state.js';
import { writeSave } from './save.js';
import { sfx, say } from './audio.js';
import { toonMat } from './bear.js';
import { mat, starShape } from './props.js';

/*
 * Sky Park toys: an interactive swing set (pump it, loop-the-loop!) and a little airplane
 * with a runway, numbered star rings and sky stars. The bear is "driven" by these modes:
 *   PL.swinging = a swing object   → updateSwing()
 *   PL.flying   = the flight state → updateFlight()
 */

const M = (c) => toonMat(c);

export const SWING_SET = { x: 30.5, z: -7.5, H: 3.3, L: 2.5 };
export const AIRFIELD = {
  x0: 14, x1: 34, z: -18.8, hw: 1.8,
  park: { x: 17.5, z: -18.8, yaw: Math.PI / 2 },
  pad: { x: 17.5, z: -15.8, r: 1.3 },
};
const SEAT_DROP = 0.165; // bear origin sits this far below the rod end
const RING_WORDS = ['one', 'two', 'three', 'four', 'five'];
const FLY_CENTER = { x: 20, z: 3, a: 88, b: 58 };

function box(parent, w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function labelSprite(text, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg;
  x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
  x.lineWidth = 8; x.strokeStyle = '#ffffff'; x.stroke();
  x.fillStyle = fg;
  x.font = 'bold 84px "Segoe UI", Arial, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  return s;
}

/* -------------------------------------------------------------------------------------------
 * Build
 * ----------------------------------------------------------------------------------------- */
function buildSwingSet(ctx, toys) {
  const { scene, obstacles } = ctx;
  const { x: cx, z: cz, H, L } = SWING_SET;
  const set = new THREE.Group();

  // Soft rubber mat under the whole set.
  const matFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 6.4), mat(0xf6d9a0));
  matFloor.position.set(cx, 0.03, cz);
  matFloor.receiveShadow = true;
  set.add(matFloor);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.06, 6.7), mat(0xef6c3a));
  edge.position.set(cx, 0.015, cz);
  set.add(edge);

  // Two A-frames and a crossbar.
  const legLen = Math.hypot(H, 1.05);
  const tilt = Math.atan2(1.05, H);
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const leg = box(set, 0.16, legLen, 0.16, 0xef6c3a, cx + sx * 2.6, H / 2, cz + sz * 0.525);
      leg.rotation.x = -sz * tilt;
      obstacles.push({ x: cx + sx * 2.6, z: cz + sz * 1.05, r: 0.28 });
    });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0xffca28));
    cap.position.set(cx + sx * 2.6, H + 0.02, cz);
    set.add(cap);
  });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.4, 12), mat(0xffca28));
  bar.rotation.z = Math.PI / 2;
  bar.position.set(cx, H, cz);
  bar.castShadow = true;
  set.add(bar);
  // A little star flag on top.
  const flagPole = box(set, 0.05, 0.9, 0.05, 0x8d5a3b, cx, H + 0.45, cz);
  flagPole.castShadow = false;
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.34, 0.15), { depth: 0.07, bevelEnabled: false }), M(0xffd54f));
  star.position.set(cx, H + 1.05, cz);
  set.add(star);
  toys.setStar = star;

  // Two swings.
  const defs = [{ x: cx - 1.1, col: 0xe53935 }, { x: cx + 1.1, col: 0x1e88e5 }];
  defs.forEach((d, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(d.x, H, cz);
    [-0.28, 0.28].forEach((rx) => {
      const rod = box(pivot, 0.035, L, 0.035, 0xfff8ef, rx, -L / 2, 0);
      rod.castShadow = false;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 10), mat(0xffca28));
      ring.position.set(rx, -0.02, 0);
      pivot.add(ring);
    });
    const seat = box(pivot, 0.72, 0.07, 0.36, d.col, 0, -L, 0);
    box(pivot, 0.72, 0.03, 0.4, 0xffffff, 0, -L - 0.045, 0).castShadow = false;
    set.add(pivot);

    // Glowing mount pad under the swing.
    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1.0, 36),
      new THREE.MeshBasicMaterial({ color: 0xfff176, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }),
    );
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.set(d.x, 0.075, cz);
    set.add(padRing);
    obstacles.push({ x: d.x, z: cz, r: 0.5 });

    toys.swings.push({
      i, x: d.x, z: cz, H, L, pivot, seat, padRing,
      theta: 0, omega: 0, phase: i * 1.7, taken: false, loops: 0, maxAmp: 0, ridden: 0,
    });
  });
  scene.add(set);
}

function buildAirfield(ctx, toys) {
  const { scene, obstacles, camBlock } = ctx;
  const A = AIRFIELD;
  const len = A.x1 - A.x0;
  const cx = (A.x0 + A.x1) / 2;
  const g = new THREE.Group();

  // Runway: dark strip, dashed centre line, side stripes, edge lights, start bars.
  const strip = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, A.hw * 2), mat(0x6f7480));
  strip.position.set(cx, 0.03, A.z);
  strip.receiveShadow = true;
  g.add(strip);
  for (let x = A.x0 + 2; x < A.x1 - 1; x += 3) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.16), mat(0xfff8ef));
    d.position.set(x, 0.065, A.z);
    g.add(d);
  }
  [-1, 1].forEach((s) => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.1), mat(0xfdd835));
    e.position.set(cx, 0.065, A.z + s * (A.hw - 0.12));
    g.add(e);
    for (let x = A.x0 + 1; x <= A.x1; x += 4) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: x % 8 === 1 ? 0xff5252 : 0xfff176 }));
      lamp.position.set(x, 0.12, A.z + s * (A.hw + 0.3));
      g.add(lamp);
    }
  });
  for (let i = 0; i < 6; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.16), mat(0xfff8ef));
    bar.position.set(A.x0 + 0.7, 0.065, A.z - 1.5 + i * 0.6);
    g.add(bar);
  }

  // Hangar with a round roof, standing by the runway start.
  const hangar = new THREE.Group();
  box(hangar, 4.2, 2.4, 0.2, 0xfff3e0, 0, 1.2, 1.5);
  [-1, 1].forEach((s) => box(hangar, 0.2, 2.4, 3.2, 0xfff3e0, 2.0 * s, 1.2, 0));
  [-1, 1].forEach((s) => {
    const half = box(hangar, 2.6, 0.14, 3.5, 0xe53935, 1.12 * s, 2.72, 0);
    half.rotation.z = -s * 0.5;
  });
  const sign = box(hangar, 2.2, 0.5, 0.1, 0xffca28, 0, 3.0, -1.7);
  sign.castShadow = false;
  box(hangar, 1.0, 0.08, 0.12, 0xe53935, 0, 3.0, -1.76);
  hangar.position.set(37.8, 0, -18.4);
  g.add(hangar);
  camBlock.push(hangar);
  obstacles.push({ box: true, x: 37.8, z: -18.4, hw: 2.15, hd: 1.7, r: 0.3 });
  // The parked plane is solid too (the bear may only board from the pad).
  obstacles.push({ box: true, x: A.park.x, z: A.park.z, hw: 1.5, hd: 2.1, r: 0.2 });

  // Windsock.
  const sock = new THREE.Group();
  box(sock, 0.1, 3.0, 0.1, 0xfff8ef, 0, 1.5, 0);
  const cone = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.34 - i * 0.07, 0.4 - i * 0.07, 0.36, 10, 1, true), new THREE.MeshToonMaterial({
      color: i % 2 ? 0xfff8ef : 0xff7043, side: THREE.DoubleSide, gradientMap: M(0xffffff).gradientMap,
    }));
    seg.rotation.z = Math.PI / 2;
    seg.position.x = 0.2 + i * 0.36;
    cone.add(seg);
  }
  cone.position.set(0, 2.9, 0);
  sock.add(cone);
  sock.position.set(22, 0, -16.2);
  g.add(sock);
  obstacles.push({ x: 22, z: -16.2, r: 0.25 });
  toys.windsock = cone;

  // Boarding pad: glows when the plane is ready, grey when it is not yet unlocked.
  const padMat = new THREE.MeshBasicMaterial({ color: 0xfff176, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.3, 36), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(A.pad.x, 0.075, A.pad.z);
  g.add(pad);
  const padStar = new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.55, 0.24)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  padStar.rotation.x = -Math.PI / 2;
  padStar.position.set(A.pad.x, 0.08, A.pad.z);
  g.add(padStar);
  toys.pad = { mesh: pad, mat: padMat, star: padStar };

  // Padlock bubble over the plane while it is still locked.
  const lock = labelSprite('🔒', '#90a4ae', '#ffffff');
  lock.scale.setScalar(1.5);
  lock.position.set(A.park.x, 2.6, A.park.z);
  g.add(lock);
  toys.lock = lock;

  scene.add(g);
}

function buildPlane(ctx, toys) {
  const { scene } = ctx;
  const plane = new THREE.Group();
  plane.rotation.order = 'YXZ';
  const red = 0xe53935;
  const yellow = 0xffd54f;
  const white = 0xfff8ef;

  // Fuselage: a plump red body, white belly, yellow nose and a cute round tail.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 14), M(red));
  body.scale.set(1, 0.95, 2.0);
  body.castShadow = true;
  plane.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), M(white));
  belly.scale.set(1.03, 0.95, 2.03);
  plane.add(belly);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), M(yellow));
  nose.position.set(0, 0, 1.05);
  nose.scale.set(1, 0.95, 0.85);
  plane.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 12), M(red));
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0.08, -1.25);
  tail.castShadow = true;
  plane.add(tail);

  // Wings and tail fins.
  const wing = box(plane, 4.6, 0.09, 0.96, yellow, 0, 0.12, 0.15);
  [-1, 1].forEach((s) => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.09, 14), M(red));
    tip.position.set(2.3 * s, 0.12, 0.15);
    tip.castShadow = true;
    plane.add(tip);
    const stripe = box(plane, 0.5, 0.1, 0.96, red, 1.55 * s, 0.12, 0.15);
    stripe.castShadow = false;
  });
  wing.castShadow = true;
  const fin = box(plane, 0.09, 0.78, 0.62, red, 0, 0.62, -1.18);
  fin.rotation.x = 0.35;
  box(plane, 1.7, 0.07, 0.52, yellow, 0, 0.1, -1.3);

  // Propeller.
  const spinner = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M(red));
  spinner.position.set(0, 0, 1.36);
  plane.add(spinner);
  const prop = new THREE.Group();
  prop.position.set(0, 0, 1.38);
  [0, Math.PI / 2].forEach((a) => {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.035), new THREE.MeshBasicMaterial({ color: 0x455a64 }));
    blade.rotation.z = a;
    prop.add(blade);
  });
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.66, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
  );
  prop.add(disc);
  plane.add(prop);

  // Wheels.
  [[-0.42, 0.35], [0.42, 0.35], [0, -1.0]].forEach(([wx, wz], i) => {
    const strut = box(plane, 0.05, 0.4, 0.05, 0x78909c, wx, -0.4, wz);
    strut.castShadow = false;
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(i === 2 ? 0.1 : 0.15, i === 2 ? 0.1 : 0.15, 0.1, 12), M(0x37474f));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, -0.58, wz);
    plane.add(wheel);
  });

  // Glass bubble over the cockpit.
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    new THREE.MeshBasicMaterial({ color: 0xb3e5fc, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
  );
  canopy.position.set(0, 0.34, 0.2);
  canopy.renderOrder = 4;
  plane.add(canopy);

  const seat = new THREE.Object3D();
  seat.position.set(0, 0.2, 0.18);
  plane.add(seat);

  // Shadow blob so the child can judge height.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 2;
  scene.add(shadow);

  const A = AIRFIELD.park;
  plane.position.set(A.x, 0.55, A.z);
  plane.rotation.y = A.yaw;
  scene.add(plane);
  toys.plane = { group: plane, prop, seat, shadow, canopy, hidden: 0 };
}

/** Five numbered rings along a lap, plus sky stars between them. */
function buildSky(ctx, toys) {
  const { scene } = ctx;
  const P = [
    [38, 8, -17], [55, 11.5, -5], [57, 15.5, 12], [38, 19, 22], [17, 14.5, 15],
  ];
  const start = [14, 2, -18.8];
  const cols = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5];
  P.forEach((p, i) => {
    const prev = i === 0 ? start : P[i - 1];
    const next = i === P.length - 1 ? [p[0] - 14, p[1] - 3, p[2] - 8] : P[i + 1];
    let tx = next[0] - prev[0];
    let tz = next[2] - prev[2];
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const g = new THREE.Group();
    const R = 4.4;
    const torusMat = new THREE.MeshBasicMaterial({ color: cols[i], transparent: true, opacity: 1 });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(R, 0.26, 10, 32), torusMat);
    g.add(torus);
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.55, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }),
    );
    g.add(glow);
    const label = labelSprite(String(i + 1), '#ffb300', '#4e342e');
    label.scale.setScalar(3.4);
    label.position.set(0, R + 1.7, 0);
    g.add(label);
    g.position.set(p[0], p[1], p[2]);
    g.rotation.y = Math.atan2(tx, tz);
    scene.add(g);
    toys.rings.push({
      idx: i, x: p[0], y: p[1], z: p[2], nx: tx, nz: tz, R, group: g, torusMat, glow, label, passed: false, pop: 0,
    });
  });

  // Sky stars: three between each pair of rings (and after takeoff).
  const route = [start, ...P];
  const starGeo = new THREE.ExtrudeGeometry(starShape(0.5, 0.22), { depth: 0.14, bevelEnabled: false });
  starGeo.translate(0, 0, -0.07);
  for (let s = 0; s < route.length - 1; s++) {
    const a = route[s];
    const b = route[s + 1];
    for (let k = 1; k <= 3; k++) {
      const t = k / 4;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t + 2.2 * Math.sin(t * Math.PI);
      const z = a[2] + (b[2] - a[2]) * t;
      const m = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffd54f }));
      m.position.set(x, y, z);
      m.scale.setScalar(1.15);
      scene.add(m);
      toys.stars.push({ mesh: m, x, y, z, alive: true });
    }
  }
}

export function buildToys(ctx) {
  const toys = {
    swings: [], rings: [], stars: [], fl: null, plane: null, pad: null, lock: null, windsock: null,
    boardingBlocked: false,
  };
  buildSwingSet(ctx, toys);
  buildAirfield(ctx, toys);
  buildPlane(ctx, toys);
  buildSky(ctx, toys);
  return toys;
}

/* -------------------------------------------------------------------------------------------
 * Helpers shared with quest / main
 * ----------------------------------------------------------------------------------------- */
export function planeUnlocked() {
  return S.quest >= G.planeStep || S.finished;
}

function hud() { G.onEvent('hud'); }

function addCoins(n) {
  S.coins += n;
  writeSave(S);
  hud();
}

/* -------------------------------------------------------------------------------------------
 * Swing
 * ----------------------------------------------------------------------------------------- */
const swingR = (sw) => sw.L + SEAT_DROP;

function placeOnSwing(sw) {
  const r = swingR(sw);
  PL.x = sw.x;
  PL.z = sw.z + r * Math.sin(sw.theta);
  PL.y = sw.H - r * Math.cos(sw.theta);
}

/** Called by the player when grounded: sit down if the bear touches a free swing. */
export function tryMountSwing(world, locked) {
  const t = world.toys;
  if (!t || locked || PL.swinging || PL.flying || PL.onSlide || G.time < (G.swingCool || 0)) return false;
  if (PL.y > 1.5 || !PL.onG) return false;
  if (t.swingBlocked) {
    if (t.swings.every((sw) => Math.hypot(PL.x - sw.x, PL.z - sw.z) > 1.8)) t.swingBlocked = false;
    else return false;
  }
  for (const sw of t.swings) {
    if (sw.taken) continue;
    if (Math.hypot(PL.x - sw.x, PL.z - sw.z) < 1.2) {
      sw.taken = true;
      sw.ridden = 0;
      sw.loops = 0;
      sw.high = false;
      sw.maxAmp = Math.abs(sw.theta);
      sw.omega = Math.abs(sw.omega) > 0.6 ? sw.omega : 1.3; // a friendly first push
      PL.swinging = sw;
      PL.vx = 0; PL.vz = 0; PL.vy = 0;
      PL.diving = false; PL.stomping = false; PL.sliding = 0; PL.climbing = null;
      PL.onG = false; PL.jumps = 0;
      PL.yaw = 0;
      placeOnSwing(sw);
      sfx.pop();
      say('swing');
      return true;
    }
  }
  return false;
}

function launchFromSwing(world, sw) {
  const r = swingR(sw);
  const vz = clamp(r * Math.cos(sw.theta) * sw.omega, -11, 11);
  const vy = clamp(r * Math.sin(sw.theta) * sw.omega, 0, 9);
  PL.swinging = null;
  sw.taken = false;
  PL.vx = 0;
  PL.vz = vz;
  PL.vy = Math.min(10, vy + 3.2);
  PL.carry = true;
  PL.onG = false;
  PL.wasG = false;
  PL.jumps = 1;
  PL.launched = true;
  PL.yaw = vz >= 0 ? 0 : Math.PI;
  G.swingCool = G.time + 1.6;
  world.toys.swingBlocked = true;
  IN.diveBuf = 0;
  sfx.jump();
  if (Math.abs(vz) > 5) say('wheee', { soft: true });
}

export function updateSwing(world, dt, inp) {
  const sw = PL.swinging;
  if (!sw) return;
  sw.ridden += dt;
  if (!inp.locked) {
    // Tap the jump button for a push; hold the stick for steady pumping.
    if (inp.jump) {
      sw.omega += (Math.sign(sw.omega) || 1) * 0.55;
      sfx.click();
    }
    if (inp.dive) {
      launchFromSwing(world, sw);
      return;
    }
  }
  const gOverL = 14 / sw.L;
  let alpha = -gOverL * Math.sin(sw.theta) - 0.1 * sw.omega;
  if (!inp.locked && inp.wmag > 0.3) {
    if (Math.abs(sw.omega) < 0.4) sw.omega += (inp.wz >= 0 ? 1 : -1) * 2.2 * dt;
    else alpha += Math.sign(sw.omega) * 1.9;
  }
  sw.omega = clamp(sw.omega + alpha * dt, -5.8, 5.8);
  sw.theta += sw.omega * dt;
  if (sw.theta > Math.PI) {
    sw.theta -= Math.PI * 2;
    swingLoop(sw);
  } else if (sw.theta < -Math.PI) {
    sw.theta += Math.PI * 2;
    swingLoop(sw);
  }
  if (Math.abs(sw.theta) < Math.PI * 0.9) sw.maxAmp = Math.max(sw.maxAmp, Math.abs(sw.theta));
  if (sw.maxAmp >= 1.0 && !sw.high) {
    sw.high = true;
    G.onEvent('swing');
  }
  if (sw.maxAmp < 0.5 && sw.ridden > 5 && sw.ridden - (sw.hintT || 0) > 6) {
    sw.hintT = sw.ridden;
    say('higher', { soft: true });
  }
  placeOnSwing(sw);
  PL.vy = 0;
  PL.onG = false;
  PL.wasG = false;
  G.camYaw = lerpAngle(G.camYaw, Math.sin(G.camYaw) >= 0 ? Math.PI / 2 : -Math.PI / 2, Math.min(1, dt * 2));
}

function swingLoop(sw) {
  sw.loops += 1;
  sfx.star();
  addCoins(1);
  G.burst(PL.x, PL.y + 0.6, PL.z, 0xffd54f);
  if (sw.loops === 1) say('flip');
  else say('wheee', { soft: true });
  G.onEvent('flip');
}

/* -------------------------------------------------------------------------------------------
 * Airplane
 * ----------------------------------------------------------------------------------------- */
function floorAt(x, z) {
  const A = AIRFIELD;
  const dx = Math.max(A.x0 - 2 - x, 0, x - (A.x1 + 2));
  const dz = Math.max(Math.abs(z - A.z) - A.hw, 0);
  return Math.min(6, 1.2 + Math.hypot(dx, dz) * 0.5);
}

export function tryBoardPlane(world, locked) {
  const t = world.toys;
  if (!t || locked || PL.flying || PL.swinging || PL.onSlide || !PL.onG || PL.y > 1.2) return false;
  const pad = AIRFIELD.pad;
  const d = Math.hypot(PL.x - pad.x, PL.z - pad.z);
  if (d > pad.r) {
    t.boardingBlocked = false;
    if (d > pad.r + 1.5) t.padCool = false;
    return false;
  }
  // After landing, the bear must leave the pad before another flight can start.
  if (t.boardingBlocked) return false;
  if (!planeUnlocked()) {
    if (!t.padCool) {
      t.padCool = true;
      sfx.wrong();
      say('notyet', { soft: true });
    }
    return false;
  }
  startFlight(world);
  return true;
}

function startFlight(world) {
  const t = world.toys;
  const pk = AIRFIELD.park;
  const fl = {
    phase: 'takeoff', speed: 0, yaw: pk.yaw, pitch: 0, roll: 0, spin: 0, spinT: 0, ringNext: 0,
    dirT: 0, dir: '', sayCool: G.time + 4, t: 0, px: pk.x, py: 0.55, pz: pk.z, rollCool: 0,
  };
  t.fl = fl;
  t.plane.hidden = 0;
  t.plane.group.visible = true;
  PL.flying = fl;
  PL.swimming = false; PL.submerged = false; PL.diving = false; PL.stomping = false; PL.sliding = 0;
  PL.vx = 0; PL.vz = 0; PL.vy = 0;
  PL.x = pk.x; PL.y = 0.55; PL.z = pk.z; PL.yaw = pk.yaw;
  PL.onG = false; PL.wasG = false;
  t.rings.forEach((r) => { r.passed = false; });
  t.stars.forEach((s) => { s.alive = true; s.mesh.visible = true; });
  sfx.star();
  G.burst(pk.x, 1.2, pk.z, 0xffd54f);
  say('fly');
  G.onEvent('board');
}

function endFlight(world) {
  const t = world.toys;
  const pad = AIRFIELD.pad;
  t.fl = null;
  t.boardingBlocked = true;
  PL.flying = null;
  // Leave the bear's whole body clear of the automatic boarding area.
  PL.x = pad.x; PL.z = pad.z + pad.r + PL.r + 0.5; PL.y = 0;
  PL.vx = 0; PL.vz = 0; PL.vy = 2;
  PL.onG = false; PL.wasG = false; PL.jumps = 1;
  PL.yaw = Math.PI;
  // The plane pops back into its parking spot.
  t.plane.hidden = G.time + 0.9;
  t.plane.group.visible = false;
  t.plane.shadow.visible = false;
  G.burst(t.plane.group.position.x, t.plane.group.position.y + 0.6, t.plane.group.position.z, 0xb3e5fc);
  G.camYaw = Math.PI;
  addCoins(0);
  sfx.star();
  G.onEvent('landed');
}

function passRing(world, fl, ring) {
  ring.passed = true;
  ring.pop = 1;
  fl.ringNext += 1;
  sfx.star();
  G.burst(ring.x, ring.y, ring.z, 0xffd54f);
  say(RING_WORDS[ring.idx]);
  G.onEvent('ring', ring.idx);
  if (fl.ringNext >= world.toys.rings.length) {
    // A full lap: bonus coins, and the rings light up again.
    fl.ringNext = 0;
    addCoins(5);
    G.onEvent('lap');
    setTimeout(() => world.toys.rings.forEach((r) => { r.passed = false; }), 900);
  }
}

export function updateFlight(world, dt, inp) {
  const t = world.toys;
  const fl = t.fl;
  if (!fl) return;
  fl.t += dt;
  const A = AIRFIELD;
  const prevX = PL.x; const prevY = PL.y; const prevZ = PL.z;

  // Barrel roll with the jump button.
  if (fl.rollCool > 0) fl.rollCool -= dt;
  if (inp.jump && !inp.locked && fl.phase === 'fly' && fl.spinT <= 0 && fl.rollCool <= 0) {
    fl.spinT = 0.95;
    fl.rollCool = 1.4;
    sfx.jump();
    say('roll', { soft: true });
    addCoins(1);
  }
  let spin = 0;
  if (fl.spinT > 0) {
    fl.spinT = Math.max(0, fl.spinT - dt);
    const k = 1 - fl.spinT / 0.95;
    spin = (k * k * (3 - 2 * k)) * Math.PI * 2;
  }

  const ix = inp.locked ? 0 : inp.ix;
  const iy = inp.locked ? 0 : inp.iy;

  // Press the landing button to head home; press again to keep flying.
  if (inp.dive && !inp.locked) {
    if (fl.phase === 'fly') { fl.phase = 'approach'; say('land-plane'); sfx.click(); } else if (fl.phase === 'approach' || fl.phase === 'glide') { fl.phase = 'fly'; sfx.click(); }
  }

  const approachPt = { x: A.x0 - 30, y: 9.5, z: A.z };
  const touchX = A.x0 + 6;
  const slope = (approachPt.y - 0.55) / (touchX - approachPt.x);

  if (fl.phase === 'takeoff') {
    fl.speed = Math.min(13, fl.speed + 4.6 * dt);
    const rot = fl.speed > 8.5;
    fl.pitch += ((rot ? 0.36 : 0) - fl.pitch) * Math.min(1, dt * 3);
    PL.x += Math.sin(fl.yaw) * fl.speed * dt;
    PL.z += Math.cos(fl.yaw) * fl.speed * dt;
    if (rot) PL.y += Math.sin(fl.pitch) * fl.speed * dt;
    else PL.y = 0.55;
    if (PL.y > 3.4) fl.phase = 'fly';
  } else if (fl.phase === 'fly') {
    // Smooth steering (eased turn rate) plus a gentle pull toward the next ring when the stick is idle.
    const dz0 = 0.12;
    const sx = Math.abs(ix) < dz0 ? 0 : ix;
    const sy = Math.abs(iy) < dz0 ? 0 : iy;
    fl.yr = (fl.yr || 0) + (-sx * 1.15 - (fl.yr || 0)) * Math.min(1, dt * 3.5);
    fl.yaw += fl.yr * dt;
    let pitchTarget = clamp(sy * 0.5, -0.5, 0.5);
    const nr = inp.locked ? null : t.rings.find((q) => !q.passed && q.idx === fl.ringNext);
    if (nr) {
      const rdx = nr.x - PL.x; const rdz = nr.z - PL.z;
      const dist = Math.hypot(rdx, rdz);
      let diff = Math.atan2(rdx, rdz) - fl.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const idle = 1 - Math.min(1, Math.abs(sx) * 1.8);
      fl.yaw += clamp(diff, -0.9, 0.9) * 0.5 * idle * dt;
      if (!sy && dist > 4) pitchTarget = clamp(Math.atan2(nr.y - PL.y, dist) * 0.9, -0.45, 0.45);
    }
    fl.pitch += (pitchTarget - fl.pitch) * Math.min(1, dt * 2.6);
    fl.speed += (10 - fl.speed) * Math.min(1, dt * 1.5);
    // Keep in the sky park: gently turn home near the edge.
    const ex = (PL.x - FLY_CENTER.x) / FLY_CENTER.a;
    const ez = (PL.z - FLY_CENTER.z) / FLY_CENTER.b;
    if (ex * ex + ez * ez > 0.8) {
      const want = Math.atan2(FLY_CENTER.x - PL.x, FLY_CENTER.z - PL.z);
      fl.yaw = lerpAngle(fl.yaw, want, Math.min(1, dt * 1.2));
    }
    PL.x += Math.sin(fl.yaw) * Math.cos(fl.pitch) * fl.speed * dt;
    PL.z += Math.cos(fl.yaw) * Math.cos(fl.pitch) * fl.speed * dt;
    PL.y += Math.sin(fl.pitch) * fl.speed * 0.9 * dt;
    const minY = floorAt(PL.x, PL.z);
    if (PL.y < minY) { PL.y = minY; fl.pitch = Math.max(fl.pitch, 0.06); }
    if (PL.y > 36) { PL.y = 36; fl.pitch = Math.min(fl.pitch, 0); }
  } else if (fl.phase === 'approach') {
    const want = Math.atan2(approachPt.x - PL.x, approachPt.z - PL.z);
    fl.yaw = lerpAngle(fl.yaw, want, Math.min(1, dt * 1.6));
    fl.speed += (10 - fl.speed) * Math.min(1, dt * 2);
    const wantPitch = clamp((approachPt.y - PL.y) * 0.22, -0.45, 0.45);
    fl.pitch += (wantPitch - fl.pitch) * Math.min(1, dt * 3);
    PL.x += Math.sin(fl.yaw) * Math.cos(fl.pitch) * fl.speed * dt;
    PL.z += Math.cos(fl.yaw) * Math.cos(fl.pitch) * fl.speed * dt;
    PL.y = Math.max(floorAt(PL.x, PL.z), PL.y + Math.sin(fl.pitch) * fl.speed * 0.9 * dt);
    if (Math.hypot(approachPt.x - PL.x, approachPt.z - PL.z) < 6) fl.phase = 'glide';
  } else if (fl.phase === 'glide') {
    const lateral = PL.z - A.z;
    const want = Math.PI / 2 + clamp(lateral * 0.2, -0.5, 0.5);
    fl.yaw = lerpAngle(fl.yaw, want, Math.min(1, dt * 2.2));
    fl.speed += (9.5 - fl.speed) * Math.min(1, dt * 2);
    PL.x += Math.sin(fl.yaw) * fl.speed * dt;
    PL.z += Math.cos(fl.yaw) * fl.speed * dt;
    const line = 0.55 + Math.max(0, touchX - PL.x) * slope;
    PL.y += (line - PL.y) * Math.min(1, dt * 3);
    fl.pitch += (-Math.atan(slope) * 0.8 - fl.pitch) * Math.min(1, dt * 3);
    if (PL.x >= touchX - 0.2 || PL.y <= 0.62) {
      fl.phase = 'roll';
      PL.y = 0.55;
      sfx.pop();
      G.burst(PL.x, 0.2, PL.z, 0xffffff);
    }
  } else if (fl.phase === 'roll') {
    fl.speed = Math.max(0, fl.speed - 5.2 * dt);
    fl.pitch += (0 - fl.pitch) * Math.min(1, dt * 6);
    fl.yaw = lerpAngle(fl.yaw, Math.PI / 2, Math.min(1, dt * 3));
    PL.x += Math.sin(fl.yaw) * fl.speed * dt;
    PL.z += Math.cos(fl.yaw) * fl.speed * dt;
    PL.y = 0.55;
    if (fl.speed <= 0.4) {
      endFlight(world);
      return;
    }
  }

  fl.roll += (clamp(ix * 0.6, -0.6, 0.6) * (fl.phase === 'fly' ? 1 : 0) - fl.roll) * Math.min(1, dt * 4);
  fl.spin = spin;
  PL.yaw = fl.yaw;
  PL.onG = false;
  PL.wasG = false;
  G.camYaw = lerpAngle(G.camYaw, fl.yaw + Math.PI, Math.min(1, dt * 2.4));

  // Rings: crossing the ring plane inside its circle counts when it is the next one in the lap.
  if (fl.phase === 'fly') {
    for (const r of t.rings) {
      if (r.passed || r.idx !== fl.ringNext) continue;
      const d0 = (prevX - r.x) * r.nx + (prevZ - r.z) * r.nz;
      const d1 = (PL.x - r.x) * r.nx + (PL.z - r.z) * r.nz;
      if (d0 === d1 || d0 * d1 > 0) continue;
      const k = d0 / (d0 - d1);
      const qx = prevX + (PL.x - prevX) * k;
      const qy = prevY + (PL.y - prevY) * k;
      const qz = prevZ + (PL.z - prevZ) * k;
      if (Math.hypot(qx - r.x, qy - r.y, qz - r.z) < r.R * 1.45) passRing(world, fl, r);
    }
    // Sky stars.
    for (const s of t.stars) {
      if (!s.alive) continue;
      if (Math.hypot(PL.x - s.x, PL.y - s.y, PL.z - s.z) < 3.4) {
        s.alive = false;
        s.mesh.visible = false;
        sfx.coin();
        addCoins(1);
      }
    }
    // Soft direction words so the child hears up / down / left / right while steering.
    let dir = '';
    if (iy > 0.5) dir = 'up';
    else if (iy < -0.5) dir = 'down';
    else if (ix > 0.6) dir = 'right';
    else if (ix < -0.6) dir = 'left';
    if (dir && dir === fl.dir) fl.dirT += dt;
    else { fl.dir = dir; fl.dirT = 0; }
    if (dir && fl.dirT > 0.55 && G.time > fl.sayCool) {
      fl.sayCool = G.time + 7;
      say(dir, { soft: true });
    }
  }
}

/* -------------------------------------------------------------------------------------------
 * Per-frame visuals (and the bear's pose while riding)
 * ----------------------------------------------------------------------------------------- */
const tmpP = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();

export function tickToys(world, dt, time, bear) {
  const t = world.toys;
  if (!t) return;

  // Swings: unridden ones coast to a stop, then sway a little to invite you.
  t.swings.forEach((sw) => {
    if (!sw.taken) {
      const gOverL = 14 / sw.L;
      const idle = Math.sin(time * 1.5 + sw.phase) * 0.1;
      if (Math.abs(sw.theta) > 0.14 || Math.abs(sw.omega) > 0.3) {
        sw.omega += (-gOverL * Math.sin(sw.theta) - 0.45 * sw.omega) * dt;
        sw.theta += sw.omega * dt;
        if (sw.theta > Math.PI) sw.theta -= Math.PI * 2;
        if (sw.theta < -Math.PI) sw.theta += Math.PI * 2;
      } else {
        sw.omega = 0;
        sw.theta += (idle - sw.theta) * Math.min(1, dt * 2);
      }
    }
    sw.pivot.rotation.x = -sw.theta;
    const glow = sw.taken ? 0 : 0.55 + Math.sin(time * 4 + sw.phase) * 0.25;
    sw.padRing.material.opacity = glow;
    sw.padRing.scale.setScalar(1 + Math.sin(time * 4 + sw.phase) * 0.05);
  });
  if (t.setStar) t.setStar.rotation.y += dt * 1.4;

  if (t.windsock) {
    t.windsock.rotation.y = -0.6 + Math.sin(time * 1.3) * 0.25;
    t.windsock.rotation.z = -0.3 + Math.sin(time * 2.1) * 0.12;
  }

  // Plane.
  const unlocked = planeUnlocked();
  const pl = t.plane;
  const fl = t.fl;
  if (t.lock) {
    t.lock.visible = !unlocked && !fl;
    t.lock.position.y = 2.6 + Math.sin(time * 2) * 0.12;
  }
  if (t.pad) {
    t.pad.mat.color.setHex(unlocked ? 0xfff176 : 0x90a4ae);
    t.pad.mat.opacity = unlocked ? 0.6 + Math.sin(time * 4) * 0.25 : 0.45;
    t.pad.star.visible = unlocked && !fl;
    t.pad.star.rotation.z += dt * 1.2;
    t.pad.mesh.visible = !fl;
    t.pad.star.material.color.setHex(0xffffff);
  }
  if (!fl && pl.hidden && G.time >= pl.hidden) {
    pl.hidden = 0;
    const pk = AIRFIELD.park;
    pl.group.position.set(pk.x, 0.55, pk.z);
    pl.group.rotation.set(0, pk.yaw, 0);
    pl.group.visible = true;
    pl.group.scale.setScalar(0.01);
    pl.pop = 1;
    G.burst(pk.x, 1.0, pk.z, 0xfff176);
  }
  if (pl.pop) {
    const s = Math.min(1, pl.group.scale.x + dt * 3);
    pl.group.scale.setScalar(s);
    if (s >= 1) pl.pop = 0;
  }
  if (fl) {
    pl.group.position.set(PL.x, PL.y, PL.z);
    pl.group.rotation.set(-fl.pitch, fl.yaw, fl.roll + fl.spin);
    pl.group.scale.setScalar(1);
    pl.prop.rotation.z += dt * 38;
    const alt = Math.max(0, PL.y - 0.5);
    pl.shadow.visible = true;
    pl.shadow.position.set(PL.x, 0.06, PL.z);
    pl.shadow.scale.setScalar(1 + alt * 0.035);
    pl.shadow.material.opacity = Math.max(0.08, 0.3 - alt * 0.012);
  } else {
    pl.prop.rotation.z += dt * (unlocked ? 2.5 : 0.4);
    if (pl.group.visible && !pl.pop) pl.group.position.y = 0.55 + (unlocked ? Math.sin(time * 2) * 0.03 : 0);
    pl.shadow.visible = pl.group.visible;
    pl.shadow.position.set(pl.group.position.x, 0.06, pl.group.position.z);
    pl.shadow.scale.setScalar(1);
    pl.shadow.material.opacity = 0.25;
  }

  // Rings and stars.
  const next = fl ? fl.ringNext : -1;
  t.rings.forEach((r) => {
    if (r.pop > 0) r.pop = Math.max(0, r.pop - dt * 2.2);
    const isNext = r.idx === next && !r.passed;
    const s = 1 + (isNext ? Math.sin(time * 6) * 0.07 : 0) + r.pop * 0.35;
    r.group.scale.setScalar(s);
    r.torusMat.color.setHex(r.passed ? 0x66bb6a : [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5][r.idx]);
    r.torusMat.opacity = fl ? (isNext ? 1 : (r.passed ? 0.55 : 0.55)) : 0.9;
    r.glow.material.opacity = isNext ? 0.35 + Math.sin(time * 6) * 0.12 : 0.1;
    r.label.position.y = r.R + 1.7 + Math.sin(time * 2 + r.idx) * 0.15;
  });
  t.stars.forEach((s) => {
    if (s.alive) {
      s.mesh.rotation.y += dt * 2.2;
      s.mesh.position.y = s.y + Math.sin(time * 2.4 + s.x) * 0.15;
    }
  });

  // Bear pose overrides while riding.
  if (!bear) return;
  if (PL.swinging) {
    const sw = PL.swinging;
    bear.position.set(PL.x, PL.y, PL.z);
    bear.rotation.set(-sw.theta, 0, 0);
    bear.scale.setScalar(1);
  } else if (fl) {
    pl.group.updateMatrixWorld(true);
    pl.seat.getWorldPosition(tmpP);
    pl.seat.getWorldQuaternion(tmpQ);
    bear.position.copy(tmpP);
    bear.quaternion.copy(tmpQ);
    bear.scale.setScalar(0.55);
  } else if (bear && bear.scale.x !== 1) {
    bear.scale.setScalar(1);
  }
}
