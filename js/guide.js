import * as THREE from 'three';

const RAINBOW = [0xff5252, 0xffa726, 0xffee58, 0x66bb6a, 0x42a5f5, 0xab47bc];

function canvasTex(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const glowTex = canvasTex(64, 64, (x) => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
});

const beamTex = canvasTex(4, 128, (x, w, h) => {
  const g = x.createLinearGradient(0, h, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,.95)');
  g.addColorStop(0.5, 'rgba(255,255,255,.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
});

function makeSprite(color, size, opacity) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  s.scale.setScalar(size);
  return s;
}

function wing(w, h, z, color) {
  const geo = new THREE.CircleGeometry(1, 20);
  geo.scale(w, h, 1);
  geo.translate(w * 0.92, 0, 0);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, z);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  return m;
}

export function makeButterfly(front = 0xff5fb0, back = 0x8c6bff, glowing = true) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 4, 8), new THREE.MeshBasicMaterial({ color: 0x4a2a5a }));
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const wings = [1, -1].map((s) => {
    const pivot = new THREE.Group();
    pivot.scale.x = s;
    pivot.add(wing(0.19, 0.14, 0.07, front));
    pivot.add(wing(0.14, 0.1, -0.09, back));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), new THREE.MeshBasicMaterial({ color: 0xfff59d, side: THREE.DoubleSide }));
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(0.22, 0.002, 0.08);
    pivot.add(dot);
    g.add(pivot);
    return pivot;
  });
  [-1, 1].forEach((s) => {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), body.material);
    ant.position.set(0.03 * s, 0.05, 0.17);
    ant.rotation.set(0.9, 0, -0.35 * s);
    g.add(ant);
  });
  if (glowing) {
    g.add(makeSprite(0xfff1a8, 1.1, 0.55));
    g.scale.setScalar(1.7);
  }
  return { root: g, wings };
}

function ring(inner, outer, color) {
  const geo = new THREE.RingGeometry(inner, outer, 40);
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide,
  }));
}

export function makeGuide(scene) {
  const fly = makeButterfly();
  fly.root.position.set(-2, 2, 4);
  scene.add(fly.root);

  const beacon = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 9, 20, 1, true),
    new THREE.MeshBasicMaterial({
      map: beamTex, color: 0xffffff, transparent: true, opacity: 0.55,
      depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.y = 4.5;
  beacon.add(beam);
  const baseRing = ring(0.85, 1.15, 0xffffff);
  baseRing.position.y = 0.06;
  beacon.add(baseRing);
  beacon.visible = false;
  scene.add(beacon);

  const marks = [];
  for (let i = 0; i < 12; i++) {
    const m = ring(0.5, 0.68, 0xffffff);
    m.visible = false;
    scene.add(m);
    marks.push(m);
  }

  const sparks = [];
  for (let i = 0; i < 90; i++) {
    const s = makeSprite(0xffffff, 0.2, 0);
    s.visible = false;
    scene.add(s);
    sparks.push({ s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, g: 0, size: 0.2 });
  }

  return {
    fly, beacon, beam, baseRing, marks, sparks,
    pos: fly.root.position, vel: new THREE.Vector3(), trailT: 0, si: 0, pulsed: new Set(),
  };
}

function spark(g, x, y, z, color, size, life, vx, vy, vz, grav) {
  const p = g.sparks[g.si];
  g.si = (g.si + 1) % g.sparks.length;
  p.s.position.set(x, y, z);
  p.s.material.color.setHex(color);
  p.s.visible = true;
  p.life = life; p.max = life; p.size = size;
  p.vx = vx; p.vy = vy; p.vz = vz; p.g = grav;
}

/** Rainbow sparkle burst for collecting, popping and cheering. */
export function burst(g, x, y, z, color) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.6 + Math.random() * 2.4;
    const c = color && i % 2 ? color : RAINBOW[i % RAINBOW.length];
    spark(g, x, y, z, c, 0.32 + Math.random() * 0.25, 0.7 + Math.random() * 0.4,
      Math.cos(a) * sp, 2.5 + Math.random() * 3, Math.sin(a) * sp, 7);
  }
}

const desired = new THREE.Vector3();

/**
 * target: { x, z, y?, gy?, color? } or null.
 * marks: items to ring and pulse (collect steps).
 * camYaw tells where the camera looks so the butterfly stays on screen.
 */
export function updateGuide(g, dt, time, pl, target, marks, camYaw) {
  const flap = Math.sin(time * 15) * 0.95;
  g.fly.wings[0].rotation.z = flap;
  g.fly.wings[1].rotation.z = -flap;

  let near = false;
  if (target) {
    const dx = target.x - pl.x;
    const dz = target.z - pl.z;
    const d = Math.hypot(dx, dz) || 1;
    const ux = dx / d;
    const uz = dz / d;
    near = d < 4.5;
    if (near) {
      const ty = (target.y ?? 0) + 1.4;
      desired.set(target.x + Math.cos(time * 2.4) * 0.9, ty + Math.sin(time * 4) * 0.12, target.z + Math.sin(time * 2.4) * 0.9);
    } else {
      const fx = -Math.sin(camYaw);
      const fz = -Math.cos(camYaw);
      const facing = ux * fx + uz * fz;
      if (facing < -0.15) {
        const side = (fx * uz - fz * ux) > 0 ? 1 : -1;
        const sx = -fz * side;
        const sz = fx * side;
        const wig = Math.sin(time * 5) * 0.35;
        desired.set(pl.x + sx * (2.1 + wig) + fx * 0.6, pl.y + 1.9, pl.z + sz * (2.1 + wig) + fz * 0.6);
      } else {
        const ahead = Math.min(3.6, d - 1.4) + Math.sin(time * 2.2) * 0.7;
        desired.set(pl.x + ux * ahead, pl.y + 1.9 + Math.sin(time * 3) * 0.18, pl.z + uz * ahead);
      }
    }
  } else {
    const a = time * 0.9;
    desired.set(pl.x + Math.cos(a) * 1.2, pl.y + 2 + Math.sin(time * 3) * 0.12, pl.z + Math.sin(a) * 1.2);
  }

  const prevX = g.pos.x;
  const prevZ = g.pos.z;
  g.pos.lerp(desired, 1 - Math.exp(-dt * 3.2));
  const mvx = g.pos.x - prevX;
  const mvz = g.pos.z - prevZ;
  if (Math.abs(mvx) + Math.abs(mvz) > 0.0005) {
    const yaw = Math.atan2(mvx, mvz);
    let dy = yaw - g.fly.root.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    g.fly.root.rotation.y += dy * Math.min(1, dt * 6);
  }

  g.trailT -= dt;
  if (g.trailT <= 0) {
    g.trailT = 0.04;
    const c = RAINBOW[Math.floor(time * 8) % RAINBOW.length];
    spark(g, g.pos.x + (Math.random() - 0.5) * 0.2, g.pos.y - 0.05, g.pos.z + (Math.random() - 0.5) * 0.2,
      c, 0.26, 0.9, 0, -0.25, 0, 0);
  }

  if (target) {
    const d = Math.hypot(target.x - pl.x, target.z - pl.z);
    const col = target.color ?? 0xffd54f;
    g.beacon.visible = true;
    g.beacon.position.set(target.x, target.gy ?? 0, target.z);
    g.beam.visible = d > 2.2;
    g.beam.material.color.setHex(col);
    g.baseRing.material.color.setHex(col);
    const pulse = 1 + Math.sin(time * 5) * 0.14;
    g.baseRing.scale.set(pulse, 1, pulse);
  } else {
    g.beacon.visible = false;
  }

  const now = new Set();
  g.marks.forEach((m, i) => {
    const it = marks[i];
    if (!it) { m.visible = false; return; }
    m.visible = true;
    m.position.set(it.x, 0.07, it.z);
    m.material.color.setHex(it.hl ?? 0xffffff);
    const s = 1 + Math.sin(time * 5 + i) * 0.16;
    m.scale.set(s, 1, s);
    if (it.mesh && it.s0) {
      it.mesh.scale.setScalar(it.s0 * (1 + Math.sin(time * 6 + it.x) * 0.12));
      now.add(it);
    }
  });
  g.pulsed.forEach((it) => { if (!now.has(it) && it.s0) it.mesh.scale.setScalar(it.s0); });
  g.pulsed = now;

  g.sparks.forEach((p) => {
    if (p.life <= 0) return;
    p.life -= dt;
    if (p.life <= 0) { p.s.visible = false; return; }
    p.vy -= p.g * dt;
    p.s.position.x += p.vx * dt;
    p.s.position.y += p.vy * dt;
    p.s.position.z += p.vz * dt;
    const k = p.life / p.max;
    p.s.material.opacity = Math.min(1, k * 1.6);
    p.s.scale.setScalar(p.size * (0.4 + k * 0.6));
  });
  return near;
}
