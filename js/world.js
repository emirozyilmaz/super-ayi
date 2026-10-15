import * as THREE from 'three';
import { COLORS } from './lines.js';
import { spawn, playLoop, greet } from './assets.js';
import { makeBear, toonMat } from './bear.js';
import {
  rnd, mat, roundTree, pineTree, birchTree, palmTree, rock, cloud, starShape,
} from './props.js';
import { makeButterfly } from './guide.js';
import { buildToys } from './toys.js';

const M = (c) => toonMat(c);
const GROUND = { cx: 20, cz: 3, r: 150 };

export function makeApple() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), M(0xe23d3d));
  body.scale.set(1, 0.92, 1);
  body.castShadow = true;
  g.add(body);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), M(0x6d4c41));
  stem.position.y = 0.22;
  g.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M(0x43a047));
  leaf.scale.set(1.4, 0.4, 0.8);
  leaf.position.set(0.08, 0.24, 0);
  g.add(leaf);
  return g;
}

export function makeBanana() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), M(0xffe14a));
  b.scale.set(0.7, 0.65, 1.7);
  b.rotation.z = 0.45;
  b.castShadow = true;
  g.add(b);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M(0x6d4c41));
  tip.position.set(0.12, 0.12, 0.18);
  g.add(tip);
  return g;
}

function makeFlower(word) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.55, 7), M(0x2e7d32));
  stem.position.y = 0.28;
  g.add(stem);
  const col = COLORS[word];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M(col));
    p.position.set(Math.cos(a) * 0.16, 0.62, Math.sin(a) * 0.16);
    p.castShadow = true;
    g.add(p);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), M(0xfff59d));
  c.position.y = 0.66;
  g.add(c);
  return g;
}

const COIN_STAR = new THREE.ExtrudeGeometry(starShape(0.13, 0.06), { depth: 0.09, bevelEnabled: false });
COIN_STAR.translate(0, 0, -0.045);

function makeCoin() {
  const g = new THREE.Group();
  const gold = M(0xffc83d);
  gold.emissive = new THREE.Color(0x4a3000);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.07, 22), gold);
  face.rotation.x = Math.PI / 2;
  face.castShadow = true;
  g.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 8, 24), M(0xffa000));
  g.add(rim);
  const star = new THREE.Mesh(COIN_STAR, M(0xfff3b0));
  g.add(star);
  return g;
}

function makeDuck() {
  const g = new THREE.Group();
  const white = M(0xfff8e7);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), white);
  body.scale.set(1.2, 0.85, 1.4);
  body.position.y = 0.28;
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), white);
  tail.rotation.x = -2.2;
  tail.position.set(0, 0.42, -0.38);
  g.add(tail);
  [-1, 1].forEach((s) => {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), M(0xf3e9d2));
    w.scale.set(0.35, 0.7, 1.2);
    w.position.set(0.3 * s, 0.32, -0.02);
    g.add(w);
    // Big shiny eyes that sit on the front of the head (not buried inside it).
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), new THREE.MeshBasicMaterial({ color: 0x1c1410 }));
    eye.position.set(0.085 * s, 0.56, 0.345);
    g.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(0.085 * s + 0.01, 0.57, 0.378);
    g.add(glint);
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), white);
  head.position.set(0, 0.52, 0.22);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), M(0xffb300));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.5, 0.4);
  g.add(beak);
  // The duck's broad beak already makes it look like it is smiling; add rosy cheeks.
  [-1, 1].forEach((s) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff9db0 }));
    cheek.scale.set(1.2, 0.8, 0.5);
    cheek.position.set(0.12 * s, 0.5, 0.33);
    g.add(cheek);
  });
  return g;
}

function box(parent, w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addHouse(ctx, x, z, wall, roof, rot) {
  const g = new THREE.Group();
  box(g, 2.6, 1.7, 2.3, wall, 0, 0.85, 0);
  const roofGeo = new THREE.CylinderGeometry(1.75, 1.75, 2.9, 3);
  const top = new THREE.Mesh(roofGeo, mat(roof));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 1.7 + 0.875;
  top.castShadow = true;
  g.add(top);
  box(g, 0.36, 0.95, 0.36, 0xb5654a, 0.75, 2.75, -0.5);
  box(g, 0.44, 0.12, 0.44, 0x8d4a36, 0.75, 3.25, -0.5);
  box(g, 0.72, 1.1, 0.06, 0xfff8ef, 0, 0.55, 1.16);
  box(g, 0.6, 1.0, 0.08, 0x8d5a3b, 0, 0.5, 1.18);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xffc107));
  knob.position.set(0.2, 0.5, 1.24);
  g.add(knob);
  box(g, 1.0, 0.1, 0.5, 0xd7ccc8, 0, 0.05, 1.4);
  [-0.85, 0.85].forEach((wx) => {
    box(g, 0.64, 0.64, 0.06, 0xfff8ef, wx, 1.1, 1.16);
    box(g, 0.5, 0.5, 0.08, 0xb3e5fc, wx, 1.1, 1.17);
    box(g, 0.05, 0.5, 0.1, 0xfff8ef, wx, 1.1, 1.18);
    box(g, 0.5, 0.05, 0.1, 0xfff8ef, wx, 1.1, 1.18);
    box(g, 0.14, 0.62, 0.05, roof, wx - 0.4, 1.1, 1.18);
    box(g, 0.14, 0.62, 0.05, roof, wx + 0.4, 1.1, 1.18);
    box(g, 0.66, 0.16, 0.22, 0x8d5a3b, wx, 0.74, 1.24);
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat([0xe53935, 0xfdd835, 0xec407a][(i + (wx > 0 ? 1 : 0)) % 3]));
      f.position.set(wx - 0.2 + i * 0.2, 0.86, 1.26);
      g.add(f);
    }
  });
  [-1, 1].forEach((s) => {
    box(g, 0.06, 0.55, 0.55, 0xfff8ef, 1.3 * s, 1.1, 0);
    box(g, 0.08, 0.45, 0.45, 0xb3e5fc, 1.31 * s, 1.1, 0);
  });
  g.position.set(x, 0, z);
  g.rotation.y = rot || 0;
  ctx.scene.add(g);
  ctx.camBlock.push(g);
  ctx.obstacles.push({ x, z, r: 1.55 });
}

function rainbowArch(ctx, x, z, rotY, radius) {
  const g = new THREE.Group();
  const ids = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  const arc = Math.PI / ids.length;
  ids.forEach((id, i) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.22, 10, 12, arc), M(COLORS[id]));
    mesh.rotation.z = i * arc;
    mesh.castShadow = true;
    g.add(mesh);
  });
  [-1, 1].forEach((s) => {
    const cloudFoot = cloud(Math.round(x * 7 + s * 3));
    cloudFoot.scale.setScalar(0.22);
    cloudFoot.position.set(radius * s, 0.1, 0);
    g.add(cloudFoot);
  });
  g.position.set(x, 0.22, z);
  g.rotation.y = rotY;
  ctx.scene.add(g);
  ctx.camBlock.push(g);
  return g;
}

/** Ground texture: grass blotches, sandy paths and the fountain plaza. */
function paintGround() {
  const S = 2048;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const x = c.getContext('2d');
  const k = S / (GROUND.r * 2);
  const px = (wx) => (wx - GROUND.cx + GROUND.r) * k;
  const pz = (wz) => (wz - GROUND.cz + GROUND.r) * k;
  x.fillStyle = '#7cc46a';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = i % 3 ? 'rgba(140,210,118,.45)' : 'rgba(104,178,90,.45)';
    x.beginPath();
    x.arc(rnd(i) * S, rnd(i + 3000) * S, (1.5 + rnd(i + 6000) * 5) * k, 0, Math.PI * 2);
    x.fill();
  }
  for (let i = 0; i < 2500; i++) {
    x.fillStyle = ['#fff59d', '#ffffff', '#f8bbd0', '#b3e5fc'][i % 4];
    x.beginPath();
    x.arc(px(-30 + rnd(i + 9000) * 100), pz(-28 + rnd(i + 12000) * 62), 0.12 * k, 0, Math.PI * 2);
    x.fill();
  }
  // A tidy road network: one straight avenue, evenly spaced side lanes to each "zone".
  const paths = [
    [[-15, 0], [-9, -0.6], [-3, 0], [3, 0], [8, 0], [13, 0], [20, 0], [27, 0], [34, 0], [40, 0], [42.5, -1.5], [44.5, -4.5]],
    [[-6, -2.5], [-6, -6.2]],
    [[-3, 0], [-3, 8.8]],
    [[-12, 0], [-14, 3.6]],
    [[-12, 0], [-14, -3.6]],
    [[17.5, 0], [17.5, -5.2]],
    [[23, 0], [23, 4], [23, 12], [23, 19.5]],
    [[31, 0], [31, -5], [31.2, -10.6]],
    [[34, 0], [34, 8], [34, 14], [34, 21.5]],
    [[34, 6], [36.6, 10.6]],
  ];
  const stroke = (w, col) => {
    x.strokeStyle = col;
    x.lineWidth = w * k;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    paths.forEach((p) => {
      x.beginPath();
      x.moveTo(px(p[0][0]), pz(p[0][1]));
      for (let i = 1; i < p.length - 1; i++) {
        const mx = (p[i][0] + p[i + 1][0]) / 2;
        const mz = (p[i][1] + p[i + 1][1]) / 2;
        x.quadraticCurveTo(px(p[i][0]), pz(p[i][1]), px(mx), pz(mz));
      }
      const l = p[p.length - 1];
      x.lineTo(px(l[0]), pz(l[1]));
      x.stroke();
    });
  };
  stroke(3.8, '#c9ad74');
  stroke(3.0, '#e8d3a0');
  // Sandy playground plaza (x 10.8..27.4, z -16.4..-4.4) with a darker border.
  const rr = (x0, z0, x1, z1, rad) => {
    x.beginPath();
    x.roundRect(px(x0), pz(z0), (x1 - x0) * k, (z1 - z0) * k, rad * k);
    x.fill();
  };
  x.fillStyle = '#d6bf86'; rr(10.8, -16.4, 27.4, -4.4, 1.6);
  x.fillStyle = '#f0e1b4'; rr(11.3, -15.9, 26.9, -4.9, 1.3);
  // Rainbow-coloured flagstones along the colour garden aisle.
  ['#ef5350', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#ab47bc'].forEach((c, i) => {
    x.fillStyle = c;
    x.beginPath();
    x.arc(px(23), pz(2.4 + i * 3.4), 0.5 * k, 0, Math.PI * 2);
    x.fill();
  });
  x.fillStyle = '#c9ad74';
  x.beginPath(); x.arc(px(-6), pz(1), 4.2 * k, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ecdcb0';
  x.beginPath(); x.arc(px(-6), pz(1), 3.7 * k, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 700; i++) {
    const a = rnd(i + 20000) * Math.PI * 2;
    const r = 1.7 + rnd(i + 21000) * 1.9;
    x.fillStyle = i % 2 ? 'rgba(201,173,116,.6)' : 'rgba(255,248,230,.7)';
    x.beginPath();
    x.arc(px(-6 + Math.cos(a) * r), pz(1 + Math.sin(a) * r), 0.16 * k, 0, Math.PI * 2);
    x.fill();
  }
  // Sandy beaches and turquoise floor inside the stream and lagoon basin.
  x.fillStyle = '#e5cf97';
  x.fillRect(px(8 - 2.3), pz(-25), 4.6 * k, 56 * k);
  x.fillStyle = '#1b88b8';
  x.fillRect(px(8 - 1.55), pz(-24.5), 3.1 * k, 55 * k);
  const lg = x.createRadialGradient(px(49), pz(-2), 0.5 * k, px(49), pz(-2), 12.2 * k);
  lg.addColorStop(0, '#0d6ea8');
  lg.addColorStop(0.68, '#1fa2c8');
  lg.addColorStop(0.84, '#d9bf82');
  lg.addColorStop(0.95, '#efe0b2');
  lg.addColorStop(1, 'rgba(239,224,178,0)');
  x.fillStyle = lg;
  x.beginPath(); x.arc(px(49), pz(-2), 12.2 * k, 0, Math.PI * 2); x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Ground height: carves real basins for the stream and lagoon so water has true depth. */
function groundHeightAt(wx, wz) {
  let y = 0;
  // Stream channel along x = 8, z in [-24, 30]
  const dzS = Math.max(0, Math.abs(wz - 3) - 26.5);
  const dxS = Math.abs(wx - 8) + dzS * 0.6;
  if (dxS < 2.2) {
    const t = Math.max(0, Math.min(1, (dxS - 1.05) / 1.15));
    const s = t * t * (3 - 2 * t);
    y = Math.min(y, -1.35 * (1 - s));
  }
  // Crystal Lagoon pond at (46, -8), radius ~5.4, deep enough to dive under camera.
  const dP = Math.hypot(wx - 49, wz + 2);
  if (dP < 11.4) {
    const t = Math.max(0, Math.min(1, (dP - 9.1) / 2.3));
    const s = t * t * (3 - 2 * t);
    y = Math.min(y, -2.55 * (1 - s));
  }
  return y;
}

function makeGroundMesh() {
  const geo = new THREE.PlaneGeometry(GROUND.r * 2, GROUND.r * 2, 220, 220);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i) + GROUND.cx;
    const wz = pos.getZ(i) + GROUND.cz;
    pos.setY(i, groundHeightAt(wx, wz));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({
    map: paintGround(), gradientMap: M(0xffffff).gradientMap,
  }));
  m.position.set(GROUND.cx, 0, GROUND.cz);
  m.receiveShadow = true;
  return m;
}

function waterTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#4fc3f7';
  x.fillRect(0, 0, 64, 256);
  x.strokeStyle = 'rgba(255,255,255,.55)';
  x.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    x.beginPath();
    for (let px = 0; px <= 64; px += 4) {
      const py = i * 44 + 10 + Math.sin(px / 10 + i) * 5;
      if (px === 0) x.moveTo(px, py);
      else x.lineTo(px, py);
    }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeSky(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(280, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      uniforms: {
        top: { value: new THREE.Color(0x3b8fd6) },
        mid: { value: new THREE.Color(0x9fd6f5) },
        low: { value: new THREE.Color(0xdff3fb) },
      },
      vertexShader: 'varying vec3 vp; void main() { vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vp;
        void main() {
          float h = vp.y;
          vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.75, h)) : mix(low, mid, smoothstep(-0.02, 0.12, h));
          // Soft sun glow in the upper sky.
          float sun = pow(max(0.0, dot(normalize(vp), normalize(vec3(0.35, 0.85, 0.2)))), 32.0);
          c += vec3(1.0, 0.92, 0.55) * sun * 0.55;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  sky.renderOrder = -1;
  scene.add(sky);
  return sky;
}

function addBackdrop(scene, bounds) {
  const hillGeo = new THREE.IcosahedronGeometry(1, 2);
  const greens = [0x7cc46a, 0x6fbf5f, 0x8fd27a, 0x66b85a];
  for (let i = 0; i < 46; i++) {
    const t = (i / 46) * Math.PI * 2 + rnd(i) * 0.1;
    const kk = 1.18 + rnd(i + 50) * 0.4;
    const h = new THREE.Mesh(hillGeo, mat(greens[i % greens.length]));
    h.position.set(bounds.cx + Math.cos(t) * bounds.a * kk, -1.2, bounds.cz + Math.sin(t) * bounds.b * kk);
    const s = 8 + rnd(i + 100) * 8;
    h.scale.set(s, 3 + rnd(i + 200) * 5, s * 0.8);
    h.receiveShadow = true;
    scene.add(h);
  }
  const cone = new THREE.ConeGeometry(1, 1, 7);
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2 + rnd(i + 300) * 0.25;
    const r = 125 + rnd(i + 400) * 25;
    const H = 26 + rnd(i + 500) * 22;
    const R = 18 + rnd(i + 600) * 12;
    const g = new THREE.Group();
    const m = new THREE.Mesh(cone, mat(i % 2 ? 0x9db8e0 : 0xb3a8e0, true));
    m.scale.set(R, H, R);
    m.position.y = H / 2 - 2;
    g.add(m);
    const cap = new THREE.Mesh(cone, mat(0xffffff, true));
    cap.scale.set(R * 0.3, H * 0.3, R * 0.3);
    cap.position.y = H - 2 - H * 0.15;
    g.add(cap);
    g.position.set(GROUND.cx + Math.cos(t) * r, 0, GROUND.cz + Math.sin(t) * r);
    scene.add(g);
  }

  // Richer sky: layered clouds, sun disc, balloons, stars — fun if you look up.
  const clouds = new THREE.Group();
  clouds.position.set(GROUND.cx, 0, GROUND.cz);
  for (let i = 0; i < 28; i++) {
    const c = cloud(i * 13);
    const t = (i / 28) * Math.PI * 2 + rnd(i + 20) * 0.4;
    const r = 40 + rnd(i + 700) * 95;
    const y = 22 + rnd(i + 800) * 38 + (i % 3) * 8;
    c.position.set(Math.cos(t) * r, y, Math.sin(t) * r);
    c.scale.setScalar(0.9 + rnd(i + 900) * 1.4);
    clouds.add(c);
  }
  scene.add(clouds);

  const skyDecor = new THREE.Group();
  skyDecor.position.set(GROUND.cx, 0, GROUND.cz);
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(6, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3a0, fog: false }),
  );
  sun.position.set(60, 95, -40);
  skyDecor.add(sun);
  const sunHalo = new THREE.Mesh(
    new THREE.SphereGeometry(11, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe082, transparent: true, opacity: 0.28, fog: false, depthWrite: false }),
  );
  sunHalo.position.copy(sun.position);
  skyDecor.add(sunHalo);

  const ballCols = [0xff6b6b, 0xffd93d, 0x6bcbff, 0xff8fab, 0xb39ddb];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 12), mat(ballCols[i % ballCols.length])); // balloon
    ball.position.y = 0;
    g.add(ball);
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.45, 8), mat(0x8d5a3b));
    basket.position.y = -1.5;
    g.add(basket);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), mat(0xffffff));
    cord.position.y = -0.85;
    g.add(cord);
    const t = (i / 7) * Math.PI * 2;
    g.position.set(Math.cos(t) * (35 + i * 6), 40 + rnd(i + 50) * 25, Math.sin(t) * (35 + i * 6));
    skyDecor.add(g);
  }

  const starGeo = new THREE.ShapeGeometry(starShape(0.7, 0.32));
  for (let i = 0; i < 24; i++) {
    const st = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xfff59d, fog: false, side: THREE.DoubleSide }));
    const t = rnd(i + 1200) * Math.PI * 2;
    const r = 30 + rnd(i + 1300) * 90;
    st.position.set(Math.cos(t) * r, 50 + rnd(i + 1400) * 55, Math.sin(t) * r);
    st.rotation.set(rnd(i) * 2, rnd(i + 1) * 2, rnd(i + 2));
    st.scale.setScalar(0.5 + rnd(i + 1500) * 1.2);
    skyDecor.add(st);
  }

  // Soft sky rainbow arcs high above the garden.
  for (let k = 0; k < 2; k++) {
    const cols = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5, 0x8e24aa];
    cols.forEach((c, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(14 + k * 4 - i * 0.35, 0.35, 6, 40, Math.PI),
        new THREE.MeshBasicMaterial({ color: c, fog: false, side: THREE.DoubleSide }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(k ? -25 : 30, 55 + k * 8, k ? 40 : -35);
      skyDecor.add(ring);
    });
  }
  scene.add(skyDecor);

  return { clouds, skyDecor };
}

/** Round flowering hedge on the edge of the play area. */
function addHedge(scene, bounds) {
  const N = 170;
  const hedge = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), M(0xffffff), N);
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 8, 6), M(0xffffff), N * 3);
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  const pal = Object.values(COLORS);
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const x = bounds.cx + Math.cos(t) * bounds.a;
    const z = bounds.cz + Math.sin(t) * bounds.b;
    const k = 1 + rnd(i) * 0.45;
    p.set(x, 0.5 * k, z);
    s.set(1.2 * k, 0.95 * k, 1.2 * k);
    mtx.compose(p, q, s);
    hedge.setMatrixAt(i, mtx);
    hedge.setColorAt(i, col.setHex(i % 3 ? 0x4caf50 : 0x66bb6a));
    for (let j = 0; j < 3; j++) {
      const n = i * 3 + j;
      const u = rnd(n + 900) * Math.PI * 2;
      const v = 0.25 + rnd(n + 1900) * 0.9;
      p.set(
        x + Math.cos(v) * Math.cos(u) * 1.15 * k,
        0.5 * k + Math.sin(v) * 0.9 * k,
        z + Math.cos(v) * Math.sin(u) * 1.15 * k,
      );
      s.setScalar(1);
      mtx.compose(p, q, s);
      dots.setMatrixAt(n, mtx);
      dots.setColorAt(n, col.setHex(pal[n % pal.length]));
    }
  }
  hedge.receiveShadow = true;
  scene.add(hedge);
  scene.add(dots);
}

function addStream(ctx) {
  const tex = waterTexture();
  tex.repeat.set(1, 10);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 55), new THREE.MeshToonMaterial({
    map: tex,
    color: 0x7be3ff,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide,
    gradientMap: M(0xffffff).gradientMap,
    depthWrite: false,
  }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(8, -0.04, 3);
  water.receiveShadow = true;
  water.renderOrder = 2;
  ctx.scene.add(water);
  const stones = [];
  for (let z = -23; z < 29; z += 1.5) {
    if (Math.abs(z) < 2) continue;
    [-1, 1].forEach((s, j) => {
      const n = Math.round(z * 10) + j * 1000;
      stones.push([8 + s * (1.85 + rnd(n) * 0.3), z + rnd(n + 1) * 0.8, 0.35 + rnd(n + 2) * 0.3]);
    });
  }
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const inst = new THREE.InstancedMesh(geo, mat(0xc5bccf, true), stones.length);
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  stones.forEach(([x, z, r], i) => {
    q.setFromEuler(new THREE.Euler(rnd(i), rnd(i + 1) * 3, 0));
    mtx.compose(new THREE.Vector3(x, r * 0.25, z), q, new THREE.Vector3(r, r * 0.55, r));
    inst.setMatrixAt(i, mtx);
  });
  inst.receiveShadow = true;
  ctx.scene.add(inst);

  const bridge = new THREE.Group();
  box(bridge, 3.9, 0.2, 2.8, 0xb07850, 0, 0.14, 0);
  for (let i = 0; i < 5; i++) box(bridge, 0.06, 0.02, 2.8, 0x8d5a3b, -1.6 + i * 0.8, 0.25, 0);
  [-1, 1].forEach((s) => {
    box(bridge, 3.9, 0.1, 0.1, 0x8d5a3b, 0, 0.8, 1.3 * s);
    [-1.8, -0.6, 0.6, 1.8].forEach((px) => box(bridge, 0.12, 0.7, 0.12, 0x8d5a3b, px, 0.5, 1.3 * s));
  });
  bridge.position.set(8, 0, 0);
  ctx.scene.add(bridge);
  ctx.platforms.push({ x: 8, z: 0, hw: 1.95, hd: 1.35, y: 0.24, id: 'bridge' });
  // Rail collision so the bear can't walk through the handrails.
  [-1, 1].forEach((s) => {
    ctx.obstacles.push({
      box: true, x: 8, z: 1.3 * s, hw: 1.95, hd: 0.16, r: 0.2,
    });
  });
  return tex;
}

function addGateFence(ctx) {
  const g = new THREE.Group();
  [-1, 1].forEach((s) => {
    for (let z = 3.2; z < 9.4; z += 0.45) {
      box(g, 0.1, 0.8, 0.12, 0xfff8ef, 13, 0.4, z * s);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), mat(0xfff8ef));
      tip.position.set(13, 0.88, z * s);
      g.add(tip);
    }
    box(g, 0.06, 0.08, 6.4, 0xfff8ef, 13, 0.55, 6.3 * s);
    box(g, 0.06, 0.08, 6.4, 0xfff8ef, 13, 0.25, 6.3 * s);
    for (let z = 3.4; z < 9.4; z += 0.8) ctx.obstacles.push({ x: 13, z: z * s, r: 0.35 });
  });
  ctx.scene.add(g);

  const sign = new THREE.Group();
  box(sign, 0.14, 1.6, 0.14, 0x8d5a3b, 0, 0.8, 0);
  box(sign, 1.3, 0.44, 0.1, 0xffe0b2, 0.25, 1.35, 0);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 3), mat(0xffe0b2));
  tip.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  tip.position.set(1.05, 1.35, 0);
  sign.add(tip);
  const cols = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5, 0x8e24aa];
  cols.forEach((c, i) => box(sign, 0.16, 0.3, 0.04, c, -0.25 + i * 0.17, 1.35, 0.07));
  sign.position.set(10.6, 0, -2.7);
  ctx.scene.add(sign);
  ctx.obstacles.push({ x: 10.6, z: -2.7, r: 0.3 });
}

export function buildWorld(scene, models) {
  const obstacles = [];
  const platforms = [];
  const items = [];
  const animals = [];
  const actors = [];
  const camBlock = [];
  const ctx = { scene, obstacles, platforms, camBlock };

  // Playground plaza layout (north of the avenue). The walk-up ramp climbs north along x = PLAY_X,
  // the deck sits on top, and the rainbow chute runs east from the deck.
  const PLAY_X = 17.5;
  const slide = {
    xTop: 18.6, yTop: 2.4, xEnd: 25.8, yEnd: 0.1, z: -11.5, hw: 0.7,
  };

  const sky = makeSky(scene);
  scene.add(makeGroundMesh());

  const bounds = { cx: 20, cz: 3, a: 48, b: 27 };
  addHedge(scene, bounds);
  const { clouds, skyDecor } = addBackdrop(scene, bounds);

  const waterBubbles = new THREE.Group();
  waterBubbles.visible = false;
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 + (i % 4) * 0.02, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    b.position.set((rnd(i) - 0.5) * 1.4, rnd(i + 3) * 2, (rnd(i + 7) - 0.5) * 1.4);
    waterBubbles.add(b);
  }
  scene.add(waterBubbles);
  const waterTex = addStream(ctx);
  addGateFence(ctx);

  addHouse(ctx, -14, 6, 0xffe0b2, 0xef6c3a, Math.PI);
  addHouse(ctx, -14, -6, 0xfff3e0, 0x8e24aa, 0);
  addHouse(ctx, -3, 11, 0xffccbc, 0x1e88e5, Math.PI);

  const fountain = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.45, 20), mat(0xcfd8dc));
  ring.position.y = 0.22;
  ring.castShadow = true;
  fountain.add(ring);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.2, 20), M(0x4fc3f7));
  water.position.y = 0.4;
  fountain.add(water);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.0, 10), mat(0xcfd8dc));
  pillar.position.y = 0.8;
  fountain.add(pillar);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.3, 0.22, 16), mat(0xcfd8dc));
  bowl.position.y = 1.3;
  fountain.add(bowl);
  const spout = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshToonMaterial({
    color: 0xb3e5fc, transparent: true, opacity: 0.8, gradientMap: M(0xffffff).gradientMap,
  }));
  spout.scale.set(1, 0.6, 1);
  spout.position.y = 1.48;
  fountain.add(spout);
  fountain.position.set(-6, 0, 1);
  scene.add(fountain);
  obstacles.push({ x: -6, z: 1, r: 1.6 });

  const stall = new THREE.Group();
  box(stall, 1.8, 1.0, 1.3, 0xfff3e0, 0, 0.5, 0);
  box(stall, 1.9, 0.12, 1.4, 0x8d5a3b, 0, 1.06, 0);
  [-0.8, 0.8].forEach((px) => box(stall, 0.1, 1.2, 0.1, 0x8d5a3b, px, 1.6, 0.55));
  const stripes = [0xef6c3a, 0xfff8ef];
  for (let i = 0; i < 6; i++) box(stall, 0.33, 0.08, 1.5, stripes[i % 2], -0.83 + i * 0.33, 2.25, 0.05).rotation.x = 0.25;
  [0xe53935, 0x1e88e5, 0xfdd835].forEach((c, i) => {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.32, 12), mat(c));
    hat.position.set(-0.5 + i * 0.5, 1.28, 0.2);
    stall.add(hat);
  });
  stall.position.set(-6, 0, -8);
  scene.add(stall);
  camBlock.push(stall);
  obstacles.push({ x: -6, z: -8, r: 1.15 });

  [[1.2, -2.2, 0xe53935], [2.6, -1.2, 0x1e88e5], [1.4, 0.2, 0xfdd835]].forEach(([x, z, c]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.22, 14), M(c));
    s.position.set(x, 0.11, z);
    s.receiveShadow = true;
    scene.add(s);
  });

  rainbowArch(ctx, 13, 0, Math.PI / 2, 2.6);

  function tree(kind, h, x, z, seed) {
    const t = kind === 'pine' ? pineTree(h, seed)
      : kind === 'birch' ? birchTree(h, seed)
        : kind === 'palm' ? palmTree(h, seed)
          : roundTree(h, seed, kind === 'blossom');
    t.position.set(x, 0, z);
    t.rotation.y = rnd(seed + 77) * Math.PI * 2;
    scene.add(t);
    camBlock.push(t);
    obstacles.push({ x, z, r: 0.25 + h * 0.06 });
    return t;
  }

  function prop(name, height, x, z, yaw) {
    const a = spawn(models[name], height);
    a.root.position.x = x;
    a.root.position.z = z;
    a.root.rotation.y = yaw || 0;
    scene.add(a.root);
    actors.push(a);
    return a;
  }

  const rim = [
    [17, 22], [48, 16], [52, -14], [11, 16], [-18, 14], [-15, -13], [-4, 17],
    [-8, -14], [3.5, 19], [58, 10], [62, 2],
  ];
  const kinds = ['round', 'pine', 'birch', 'blossom'];
  rim.forEach(([x, z], i) => tree(kinds[i % 4], 5.5 + (i % 3), x, z, i * 11));
  [[44, 15]].forEach(([x, z], i) => tree('round', 5, x, z, 200 + i));
  [[-10, 9], [-9, -11], [2, -9]].forEach(([x, z], i) => tree(i % 2 ? 'round' : 'blossom', 4.2, x, z, 300 + i));
  [[-10, 14], [52, 14]].forEach(([x, z], i) => {
    const r = rock(1.1, 400 + i);
    r.position.set(x, 0, z);
    scene.add(r);
    obstacles.push({ x, z, r: 0.5 });
  });
  [[44, 20], [46.6, 21.4], [42, 21.6]].forEach(([x, z], i) => {
    const r = rock(1.5, 500 + i);
    r.position.set(x, 0, z);
    scene.add(r);
    camBlock.push(r);
    obstacles.push({ x, z, r: 0.65 });
  });

  // Orderly edging: flowers in pairs along the avenue (skipping the rainbow carpet),
  // and grass tufts in two neat lines along both stream banks.
  for (let fx = 16; fx <= 44; fx += 4) {
    if (fx > 25 && fx < 35) continue;
    [-1, 1].forEach((s, j) => prop((fx / 4 + j) % 2 ? 'flowers' : 'flower', 0.55, fx, 2.6 * s, fx + j));
  }
  for (let gz = -20; gz <= 24; gz += 4) {
    if (Math.abs(gz) < 4) continue;
    prop('grass', 0.7, 5.5, gz, gz);
    prop('grass', 0.7, 10.5, gz, gz + 1);
  }
  [[13, 11], [13, -11], [37, 9], [61, -9], [-9, 6], [-1, -6]].forEach(([x, z], i) => {
    prop('bush_flowers', 1.15, x, z, i);
    obstacles.push({ x, z, r: 0.6 });
  });

  function addItem(mesh, kind, word, x, y, z, r) {
    mesh.position.set(x, y, z);
    scene.add(mesh);
    const it = { mesh, kind, word, x, y, z, r, alive: true, baseY: y, dropping: false, vy: 0, respawn: 0, cool: 0, s0: mesh.scale.x };
    items.push(it);
    return it;
  }

  // A tidy colour garden: a round stone-edged bed per colour, flowers in a neat plus-shape,
  // and a little flag in the bed's colour. Rainbow order, two columns beside the aisle.
  function colorBed(word, cx, cz) {
    const bed = new THREE.Group();
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.1, 28), mat(0x8d5a3b));
    soil.position.y = 0.05;
    soil.receiveShadow = true;
    bed.add(soil);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.17, 8, 30), mat(0xfff3e0));
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.13;
    edge.castShadow = true;
    bed.add(edge);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 6), mat(0x8d5a3b));
    pole.position.set(0, 0.62, -1.95);
    bed.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.34, 0.04), M(COLORS[word]));
    flag.position.set(0.3, 1.0, -1.95);
    bed.add(flag);
    bed.position.set(cx, 0, cz);
    scene.add(bed);
    [[0, 0], [0.95, 0], [-0.95, 0], [0, 0.95], [0, -0.95]].forEach(([dx, dz]) => {
      const f = makeFlower(word);
      f.scale.setScalar(1.5);
      addItem(f, 'flower', word, cx + dx, 0.1, cz + dz, 0.7);
    });
  }
  [['red', 19.5, 6.5], ['orange', 19.5, 11.5], ['yellow', 19.5, 16.5],
    ['green', 26.5, 6.5], ['blue', 26.5, 11.5], ['purple', 26.5, 16.5]].forEach(([w, bx, bz]) => colorBed(w, bx, bz));

  function fruitTree(word, x, z, seed) {
    if (word === 'apple') tree('round', 4.6, x, z, seed);
    else tree('palm', 2.6, x - 0.3, z - 0.2, seed);
    const maker = word === 'apple' ? makeApple : makeBanana;
    [-0.4, 0.45].forEach((dx, i) => {
      const f = maker();
      f.scale.setScalar(1.6);
      addItem(f, 'fruit', word, x + dx, 1.7 + i * 0.15, z + 0.45, 0.8);
    });
  }
  // Orchard: apples in a straight column north-east, banana palms in a row south of the avenue.
  fruitTree('apple', 37.5, -6, 600);
  fruitTree('apple', 37.5, -9, 601);
  fruitTree('apple', 37.5, -12, 602);
  fruitTree('banana', 38.6, 5.5, 603);
  fruitTree('banana', 41.6, 5.5, 604);

  const bands = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'].map((id, i) => {
    const x = 27.2 + i * 1.15;
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 5.2), M(COLORS[id]));
    m.position.set(x, 0.06, 0);
    m.receiveShadow = true;
    scene.add(m);
    return { id, x, z: 0, w: 0.55, d: 2.6, inside: false };
  });
  rainbowArch(ctx, 34, 16, 0, 3.1);

  // Coins always form a pattern: a triangle round the fountain, a line over the bridge,
  // trails along the avenue, an arc over the rainbow carpet, up the slide ramp and down the chute.
  const slideY = (cx) => {
    const t = Math.max(0, Math.min(1, (cx - slide.xTop) / (slide.xEnd - slide.xTop)));
    return slide.yTop + (slide.yEnd - slide.yTop) * t;
  };
  const coins = [
    [-6, 4.6, 0.7], [-9.1, -0.8, 0.7], [-2.9, -0.8, 0.7],
    [6.2, 0, 0.7], [8, 0, 0.7], [9.8, 0, 0.7],
    [19.5, 0, 0.7], [21.5, 0, 0.7],
    [28.3, 0, 1.4], [30.2, 0, 1.8], [32.1, 0, 1.4],
    [36, 0, 0.7], [38.5, 0, 0.7], [40.8, -0.9, 0.7],
    [23, 4, 0.7], [23, 9, 0.7], [23, 14, 0.7], [23, 19, 0.7],
    [37.5, -7.5, 0.7], [37.5, -10.5, 0.7],
  ];
  [0.2, 0.45, 0.7, 0.95].forEach((t) => {
    coins.push([PLAY_X, -5.2 - 5.2 * t, 2.4 * t + 0.75]);
  });
  [21, 23.2, 25.2].forEach((cx) => coins.push([cx, slide.z, slideY(cx) + 0.85]));
  coins.forEach(([x, z, y]) => addItem(makeCoin(), 'coin', 'coins', x, y, z, 0.7));

  // Berry bushes and the two bounce-mushrooms stand in matching pairs either side of the carpet / pond.
  [[25, 3.3], [35.4, 3.3], [36.5, -5], [61.5, -5]].forEach(([x, z]) => {
    const a = prop('bush_berries', 1.05, x, z, 0.2);
    obstacles.push({ x, z, r: 0.55 });
    items.push({ mesh: a.root, kind: 'bush', word: null, x, y: 0, z, r: 1.1, alive: true, actor: a, baseY: 0, dropping: false, vy: 0, respawn: 0, cool: 0 });
  });

  [[25, -3.4], [35.4, -3.4]].forEach(([x, z]) => {
    const a = prop('mushroom', 0.85, x, z, 0);
    items.push({ mesh: a.root, kind: 'mushroom', word: x < 30 ? 'red' : 'yellow', x, y: 0, z, r: 0.8, alive: true, actor: a, baseY: 0, dropping: false, vy: 0, respawn: 0, cool: 0, baseScale: a.root.scale.x });
  });

  // --- Super Bear Breakable Wooden Crates (jump/stomp/dive to smash for 3 coins!) ---
  function makeCrate() {
    const g = new THREE.Group();
    box(g, 0.78, 0.78, 0.78, 0xc68642, 0, 0.39, 0);
    box(g, 0.82, 0.1, 0.82, 0x8d5a3b, 0, 0.72, 0);
    box(g, 0.82, 0.1, 0.82, 0x8d5a3b, 0, 0.08, 0);
    const star = new THREE.Mesh(COIN_STAR, M(0xfff59d));
    star.position.set(0, 0.4, 0.41);
    g.add(star);
    const starB = star.clone();
    starB.position.z = -0.41;
    g.add(starB);
    return g;
  }
  // Crates always come in tidy rows or mirrored pairs.
  [
    [30, 15.5], [32.5, 15.5], [35, 15.5], [37.5, 15.5], // a tidy row in the south garden
    [4, 3.4], [4, -3.4], // a pair guarding the bridge approach
    [44, 14.5], [54, 14.5], // a pair south of the lake
  ].forEach(([cx, cz]) => {
    const m = makeCrate();
    addItem(m, 'crate', 'smash', cx, 0, cz, 0.88);
  });

  // --- Bouncy Trampoline Mushrooms: two mirrored pairs flanking the slide ---
  const trampolines = [];
  [[12.5, -6.5], [12.5, -9.5], [22.5, -6.5], [22.5, -9.5]].forEach(([tx, tz], i) => {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.52, 12), mat(0xfff3e0));
    stem.position.y = 0.26;
    g.add(stem);
    const cap = new THREE.Group();
    cap.position.y = 0.55;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(i % 2 ? 0xff4081 : 0x7c4dff),
    );
    dome.scale.set(1, 0.65, 1);
    dome.castShadow = true;
    cap.add(dome);
    for (let d = 0; d < 6; d++) {
      const a = (d / 6) * Math.PI * 2;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(0xffffff));
      dot.scale.y = 0.45;
      dot.position.set(Math.cos(a) * 0.46, 0.28, Math.sin(a) * 0.46);
      cap.add(dot);
    }
    g.add(cap);
    g.position.set(tx, 0, tz);
    scene.add(g);
    trampolines.push({ x: tx, z: tz, r: 0.92, cap, bounce: 0, cool: 0 });
  });

  // --- Rainbow Playground Slide ---
  // Walk up the wooden ramp (no jumping needed), reach the deck, stroll to its east edge, and whee!
  const slideGroup = new THREE.Group();
  const RAMP_Z0 = -5.2;
  const RAMP_Z1 = -10.4;
  const rampRise = slide.yTop;
  const rampRun = RAMP_Z0 - RAMP_Z1;
  const rampLen = Math.hypot(rampRun, rampRise);
  const ramp = new THREE.Group();
  ramp.position.set(PLAY_X, rampRise / 2 - 0.07, (RAMP_Z0 + RAMP_Z1) / 2);
  ramp.rotation.x = Math.atan2(rampRise, rampRun);
  box(ramp, 1.9, 0.14, rampLen + 0.1, 0xc68642, 0, 0, 0);
  for (let c = 0; c < 8; c++) box(ramp, 1.7, 0.05, 0.1, 0x8d5a3b, 0, 0.09, -rampLen / 2 + 0.35 + c * 0.64);
  [-0.98, 0.98].forEach((rx) => box(ramp, 0.08, 0.5, rampLen, 0xfff8ef, rx, 0.3, 0));
  slideGroup.add(ramp);
  platforms.push({
    ramp: {
      x0: PLAY_X, z0: RAMP_Z0, x1: PLAY_X, z1: RAMP_Z1, w: 0.95, y0: 0, y1: slide.yTop,
    },
    id: 'slide-ramp',
  });
  [-1, 1].forEach((s) => {
    obstacles.push({
      box: true, x: PLAY_X + 1.0 * s, z: (RAMP_Z0 + RAMP_Z1) / 2, hw: 0.08, hd: rampRun / 2, r: 0.2,
    });
  });

  // Deck on top
  const DECK_X = 17.6;
  box(slideGroup, 2.0, 0.2, 2.2, 0xff7043, DECK_X, slide.yTop - 0.1, slide.z);
  platforms.push({
    x: DECK_X, z: slide.z, hw: 1.0, hd: 1.1, y: slide.yTop, id: 'slide-deck',
  });
  [[-0.9, -1.0], [0.9, -1.0], [-0.9, 1.0], [0.9, 1.0]].forEach(([px, pz]) => {
    box(slideGroup, 0.14, slide.yTop - 0.2, 0.14, 0xffca28, DECK_X + px, (slide.yTop - 0.2) / 2, slide.z + pz);
  });
  box(slideGroup, 0.06, 0.55, 2.2, 0xfff8ef, DECK_X - 0.97, slide.yTop + 0.3, slide.z);
  box(slideGroup, 2.0, 0.55, 0.06, 0xfff8ef, DECK_X, slide.yTop + 0.3, slide.z - 1.07);
  obstacles.push({
    box: true, x: DECK_X - 0.97, z: slide.z, hw: 0.08, hd: 1.1, r: 0.2,
  });
  obstacles.push({
    box: true, x: DECK_X, z: slide.z - 1.07, hw: 1.0, hd: 0.08, r: 0.2,
  });
  // A little flag and a glowing star pad that says "slide here!"
  box(slideGroup, 0.06, 1.3, 0.06, 0x8d5a3b, DECK_X - 0.9, slide.yTop + 0.65, slide.z - 1.0);
  box(slideGroup, 0.5, 0.3, 0.04, 0xe53935, DECK_X - 0.62, slide.yTop + 1.1, slide.z - 1.0);
  const startPad = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 20), M(0xffd54f));
  startPad.position.set(slide.xTop - 0.3, slide.yTop + 0.02, slide.z);
  slideGroup.add(startPad);
  const startStar = new THREE.Mesh(COIN_STAR, M(0xfff8e1));
  startStar.scale.setScalar(1.4);
  startStar.position.set(slide.xTop - 0.3, slide.yTop + 0.1, slide.z);
  slideGroup.add(startStar);

  // Rainbow chute
  const chuteDx = slide.xEnd - slide.xTop;
  const chuteDy = slide.yEnd - slide.yTop;
  const chuteLen = Math.hypot(chuteDx, chuteDy);
  const rainbowCols = [0xe53935, 0xfb8c00, 0xfdd835, 0x43a047, 0x1e88e5, 0x8e24aa];
  const chute = new THREE.Group();
  chute.position.set((slide.xTop + slide.xEnd) / 2, (slide.yTop + slide.yEnd) / 2 - 0.04, slide.z);
  chute.rotation.z = Math.atan2(chuteDy, chuteDx);
  rainbowCols.forEach((c, i) => box(chute, chuteLen, 0.08, 0.235, c, 0, 0, -0.59 + i * 0.236));
  [-0.74, 0.74].forEach((rz) => box(chute, chuteLen, 0.3, 0.08, 0xfff8ef, 0, 0.17, rz));
  slideGroup.add(chute);
  [0.35, 0.7].forEach((t) => {
    const sx = slide.xTop + chuteDx * t;
    const sy = slide.yTop + chuteDy * t - 0.1;
    [-0.6, 0.6].forEach((sz) => box(slideGroup, 0.12, sy, 0.12, 0xffca28, sx, sy / 2, slide.z + sz));
  });
  scene.add(slideGroup);
  // --- Sky Park toys: interactive swing set, airfield with the little plane and its rings ---
  const toys = buildToys(ctx);

  // --- Bruno's Home Trophy Corner in the village ---
  // Bruno's cozy picnic rug, honey pot & star trophies in front of his house (-14, 6)
  const homeCorner = new THREE.Group();
  homeCorner.position.set(-11.2, 0, 5.6);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.45, 24), mat(0xff8fab));
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.02;
  homeCorner.add(rug);
  const honeyPot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(0xffb300));
  honeyPot.scale.set(1, 1.1, 1);
  honeyPot.position.set(-0.45, 0.26, 0.3);
  homeCorner.add(honeyPot);
  const honeyRim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 12), mat(0xffe082));
  honeyRim.position.set(-0.45, 0.5, 0.3);
  homeCorner.add(honeyRim);
  const trophies = [];
  for (let i = 0; i < 4; i++) {
    const tg = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.14, 10), mat(0x8d5a3b));
    base.position.y = 0.07;
    tg.add(base);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.28, 12), mat(0xffca28));
    cup.position.y = 0.28;
    tg.add(cup);
    const topStar = new THREE.Mesh(COIN_STAR, M(0xfff59d));
    topStar.position.y = 0.52;
    tg.add(topStar);
    tg.position.set(-0.6 + i * 0.42, 0, -0.55);
    homeCorner.add(tg);
    trophies.push(tg);
  }
  scene.add(homeCorner);

  const pond = { x: 49, z: -2, r: 11 };
  const PS = pond.r / 5.2; // underwater decoration spread
  const pondMesh = new THREE.Mesh(new THREE.CircleGeometry(pond.r, 64), new THREE.MeshToonMaterial({
    map: waterTex,
    color: 0x7be3ff,
    transparent: true,
    opacity: 0.54,
    side: THREE.DoubleSide,
    gradientMap: M(0xffffff).gradientMap,
    depthWrite: false,
  }));
  pondMesh.rotation.x = -Math.PI / 2;
  pondMesh.position.set(pond.x, -0.04, pond.z);
  pondMesh.renderOrder = 2;
  scene.add(pondMesh);
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2;
    const r = rock(0.65 + rnd(i + 700) * 0.35, 700 + i, 0xc5bccf);
    r.position.set(pond.x + Math.cos(a) * (pond.r + 0.15), -0.05, pond.z + Math.sin(a) * (pond.r + 0.15));
    scene.add(r);
  }
  prop('lilypad', 0.38, pond.x - 1.5 * PS, pond.z + 1.1 * PS, 0.4);
  prop('lilypad', 0.32, pond.x + 1.7 * PS, pond.z - 0.8, 1.2);
  prop('lilypad', 0.28, pond.x - 0.5 * PS, pond.z - 1.9 * PS, 2.1);
  const duck = makeDuck();
  duck.position.set(pond.x, 0.08, pond.z + 0.4);
  scene.add(duck);

  // --- Super Bear Crystal Lagoon underwater world ---
  const kelp = [];
  const fish = [];
  const geyserBubbles = [];
  const coralCols = [0xff6b9d, 0xff9e44, 0xc77dff, 0x48cae4, 0xffd166];

  // Glowing crystal clusters on the lagoon floor & stream bed.
  function addCrystalCluster(cx, cy, cz, col, s = 1) {
    const g = new THREE.Group();
    const matC = new THREE.MeshBasicMaterial({ color: col });
    for (let i = 0; i < 4; i++) {
      const h = (0.45 + rnd(i + cx * 10) * 0.45) * s;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, h, 5), matC);
      shard.position.set((i - 1.5) * 0.12 * s, h * 0.45, (rnd(i + 9) - 0.5) * 0.14 * s);
      shard.rotation.set((rnd(i + 3) - 0.5) * 0.45, i * 1.1, (rnd(i + 6) - 0.5) * 0.45);
      g.add(shard);
    }
    g.position.set(cx, cy, cz);
    scene.add(g);
  }

  // Branching coral tubes + fan corals inside the lagoon.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd(i + 810) * 0.3;
    const rad = (1.4 + rnd(i + 820) * 2.5) * PS;
    const cx = pond.x + Math.cos(a) * rad;
    const cz = pond.z + Math.sin(a) * rad;
    const cy = groundHeightAt(cx, cz);
    const col = coralCols[i % coralCols.length];
    const cg = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const bh = 0.38 + rnd(i * 5 + b) * 0.42;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, bh, 8), M(col));
      tube.position.set((b - 1) * 0.14, bh / 2, (rnd(b + i) - 0.5) * 0.12);
      tube.rotation.z = (b - 1) * 0.25;
      cg.add(tube);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(col));
      tip.position.set((b - 1) * 0.18, bh, (rnd(b + i) - 0.5) * 0.12);
      cg.add(tip);
    }
    cg.position.set(cx, cy, cz);
    scene.add(cg);
  }

  // Seaweed ribbons swaying in the lagoon and stream.
  const kelpSpots = [
    [pond.x - 2.2 * PS, pond.z - 1.1 * PS], [pond.x + 2.1 * PS, pond.z + 1.3 * PS],
    [pond.x - 1.1 * PS, pond.z + 2.3 * PS], [pond.x + 1.5 * PS, pond.z - 2.1 * PS],
    [pond.x - 2.7 * PS, pond.z + 0.7 * PS], [pond.x + 2.6 * PS, pond.z - 0.4 * PS],
    [8.4, -5], [7.6, -3], [8.3, 4], [7.7, 7], [8.4, 11], [7.6, -9],
  ];
  kelpSpots.forEach(([kx, kz], i) => {
    const ky = groundHeightAt(kx, kz);
    const blades = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const h = 0.55 + (i % 3) * 0.22 + b * 0.12;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, h, 0.03),
        M(b % 2 ? 0x26a69a : 0x43a047),
      );
      blade.position.set((b - 1) * 0.1, h / 2, 0);
      blades.add(blade);
    }
    blades.position.set(kx, ky, kz);
    scene.add(blades);
    kelp.push({ mesh: blades, phase: i * 0.9 });
  });

  // Glowing cyan/magenta crystals (Crystalline Lagoon nod).
  [
    [pond.x - 1.6 * PS, pond.z - 1.5 * PS, 0x48bfe3, 1.1],
    [pond.x + 1.8 * PS, pond.z + 0.4, 0xf72585, 1.0],
    [pond.x + 0.3 * PS, pond.z - 2.2 * PS, 0x72efdd, 1.15],
    [pond.x - 2.0 * PS, pond.z + 1.4 * PS, 0xb5179e, 0.95],
    [8.2, -6.5, 0x48bfe3, 0.75],
    [7.8, 5.5, 0x72efdd, 0.75],
  ].forEach(([cx, cz, col, s]) => addCrystalCluster(cx, groundHeightAt(cx, cz), cz, col, s));

  // Sunken treasure chest + underwater coins on the lagoon floor.
  const chest = new THREE.Group();
  box(chest, 0.65, 0.32, 0.44, 0x8d5a3b, 0, 0.16, 0);
  box(chest, 0.68, 0.16, 0.46, 0xa86c44, 0, 0.38, -0.04).rotation.x = -0.55;
  box(chest, 0.68, 0.06, 0.46, 0xffca28, 0, 0.28, 0);
  const glowPearl = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff59d }),
  );
  glowPearl.position.set(0, 0.34, 0.05);
  chest.add(glowPearl);
  const chestY = groundHeightAt(pond.x + 0.9, pond.z - 0.8);
  chest.position.set(pond.x + 0.9, chestY, pond.z - 0.8);
  chest.rotation.y = -0.6;
  scene.add(chest);

  // Underwater coins to reward diving into the lagoon and stream!
  [
    [pond.x - 1.1 * PS, pond.z - 0.6 * PS],
    [pond.x + 1.1 * PS, pond.z + 0.9 * PS],
    [pond.x - 0.2, pond.z + 1.4 * PS],
    [pond.x + 0.2 * PS, pond.z - 1.5 * PS],
    [8.0, -4.5],
    [8.0, 5.0],
  ].forEach(([cx, cz]) => {
    const cy = groundHeightAt(cx, cz) + 0.45;
    addItem(makeCoin(), 'coin', 'coins', cx, cy, cz, 0.85);
  });

  // Bubble geyser in the center of the lagoon (launches / boosts the bear up like SBA!).
  const geyser = { x: pond.x - 0.2, z: pond.z - 0.1, y: groundHeightAt(pond.x - 0.2, pond.z - 0.1), r: 0.95 };
  const ventRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.09, 8, 18),
    M(0x5c6bc0),
  );
  ventRing.rotation.x = Math.PI / 2;
  ventRing.position.set(geyser.x, geyser.y + 0.05, geyser.z);
  scene.add(ventRing);
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + (i % 3) * 0.03, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xb3f2ff, transparent: true, opacity: 0.75, depthWrite: false }),
    );
    b.position.set(geyser.x, geyser.y + (i / 14) * 2.4, geyser.z);
    scene.add(b);
    geyserBubbles.push({ mesh: b, off: i / 14 });
  }

  // Colorful tropical fish swimming in loops inside the lagoon & stream.
  function makeFish(col, finCol) {
    const fg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), M(col));
    body.scale.set(0.65, 0.85, 1.45);
    fg.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 4), M(finCol));
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.22;
    fg.add(tail);
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), M(0x111111));
      eye.position.set(0.07 * s, 0.03, 0.14);
      fg.add(eye);
    });
    return { root: fg, tail };
  }
  const fishPalette = [
    [0xff7043, 0xffee58], [0x29b6f6, 0xfff59d], [0xffca28, 0xff5252],
    [0xab47bc, 0x80deea], [0x66bb6a, 0xfff176], [0xff80ab, 0xffffff],
  ];
  for (let i = 0; i < 8; i++) {
    const [c1, c2] = fishPalette[i % fishPalette.length];
    const f = makeFish(c1, c2);
    scene.add(f.root);
    const inStream = i >= 6;
    fish.push({
      mesh: f.root,
      tail: f.tail,
      cx: inStream ? 8 : pond.x,
      cz: inStream ? (i === 6 ? -5 : 6) : pond.z,
      rx: inStream ? 0.65 : (1.2 + (i % 3) * 0.75) * PS,
      rz: inStream ? 2.2 : (1.1 + ((i + 1) % 3) * 0.7) * PS,
      y: inStream ? -0.65 : (-0.65 - (i % 3) * 0.45),
      sp: (i % 2 ? 1 : -1) * (0.7 + (i % 3) * 0.25),
      phase: i * 1.1,
    });
  }

  // 3D sunlit god-ray cones & glowing caustic rings on the lagoon floor.
  const sunRays = [];
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xb8f3ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
  });
  [
    [pond.x - 1.2 * PS, pond.z - 0.5 * PS, 0.7],
    [pond.x + 1.1 * PS, pond.z + 0.8 * PS, 0.85],
    [pond.x + 0.1 * PS, pond.z - 1.3 * PS, 0.65],
    [pond.x - 0.8 * PS, pond.z + 1.4 * PS, 0.75],
  ].forEach(([rx, rz, sc], i) => {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sc, 1.05 * sc, 2.5, 14, 1, true), rayMat);
    cone.position.set(rx, -1.25, rz);
    cone.rotation.z = -0.18;
    cone.rotation.x = 0.1;
    scene.add(cone);
    sunRays.push({ mesh: cone, baseX: rx, phase: i * 1.4 });
  });

  // Expanding water surface ripple rings around the swimming bear.
  const waterRipples = [];
  for (let i = 0; i < 3; i++) {
    const rp = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.42, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false,
      }),
    );
    rp.rotation.x = -Math.PI / 2;
    rp.position.y = -0.01;
    rp.renderOrder = 3;
    scene.add(rp);
    waterRipples.push(rp);
  }

  const secretMesh = new THREE.Group();
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.4, 8), M(0x8d6e63));
  stump.position.y = 0.2;
  secretMesh.add(stump);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 12), M(0xfdd835));
  hat.position.y = 0.62;
  secretMesh.add(hat);
  const secret = addItem(secretMesh, 'secret-hat', 'yellow', 34, 0, 21.5, 1.1);

  function addAnimal(name, height, word, line, x, z, wander, y) {
    const actor = spawn(models[name], height);
    actor.root.position.set(x, y || 0, z);
    scene.add(actor.root);
    playLoop(actor, 'idle');
    actors.push(actor);
    const animal = {
      actor, word, line, x, z, y: y || 0, homeX: x, homeZ: z,
      wander: wander || null, wi: 0, speed: 1.15, cool: 0, npc: !wander,
    };
    animals.push(animal);
    return animal;
  }

  const lila = addAnimal('rabbit', 1.15, 'rabbit', 'i-see-rabbit', 17, 1.2, null, 0);
  lila.npc = true;
  addAnimal('cat2', 0.85, 'cat', 'i-see-cat', 23, 22, [[23, 22], [24.6, 22.8], [21.4, 22.8]], 0);
  addAnimal('birb', 0.55, 'bird', 'i-see-bird', 34.6, -7.5, [[34.6, -7.5], [34.6, -10.8]], 0);
  addAnimal('frog', 0.7, 'frog', 'i-see-frog', 43.2, -4.6, [[43.2, -4.6], [44.6, -4.2]], 0);
  addAnimal('fox', 0.85, 'fox', 'i-see-fox', 27.5, -15.2, [[27.5, -15.2], [31.5, -15.8], [29.5, -14.2]], 0);
  addAnimal('chicken', 0.7, 'chicken', 'i-see-chicken', 4.2, 6.2, [[4.2, 6.2], [6.5, 7.2], [3.2, 7.5]], 0);
  addAnimal('rabbit', 1.05, 'rabbit', 'i-see-rabbit', 15.5, 17.5, [[15.5, 17.5], [15.5, 20.5], [16.8, 19]], 0);

  const duckAnimal = {
    actor: { root: duck, mixer: null, clips: [], action: null, busy: false },
    word: 'duck', line: 'i-see-duck', x: pond.x, z: pond.z + 0.4, y: 0.15,
    homeX: pond.x, homeZ: pond.z, wander: null, wi: 0, speed: 0, cool: 0, npc: false, duck: true,
  };
  animals.push(duckAnimal);

  const SPARK_COLS = [0xff5252, 0xffa726, 0xffee58, 0x66bb6a, 0x42a5f5, 0xab47bc];
  function makeBubble(index, x, z, y) {
    const g = new THREE.Group();
    const sph = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 18), new THREE.MeshToonMaterial({
      color: 0xe1bee7, transparent: true, opacity: 0.45, gradientMap: M(0xffffff).gradientMap, depthWrite: false,
    }));
    g.add(sph);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    shine.scale.set(1.3, 0.7, 0.5);
    shine.position.set(-0.38, 0.45, 0.6);
    g.add(shine);
    const orbit = new THREE.Group();
    SPARK_COLS.forEach((c, i) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: c }));
      const a = (i / SPARK_COLS.length) * Math.PI * 2;
      s.position.set(Math.cos(a) * 1.05, Math.sin(a * 2) * 0.15, Math.sin(a) * 1.05);
      orbit.add(s);
    });
    g.add(orbit);
    const cub = makeBear();
    cub.scale.setScalar(0.42);
    cub.position.y = -0.35;
    g.add(cub);
    g.position.set(x, y, z);
    scene.add(g);
    return { index, x, z, y, mesh: g, popped: false, cub, orbit };
  }
  const bubbles = [
    makeBubble(0, 14.5, 13.5, 1.15),
    makeBubble(1, 43.5, 2.2, 1.15),
    makeBubble(2, 40, 12, 4.15),
  ];

  const vine = { x: 37.35, z: 12, top: 3.15 };
  const vineMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, vine.top + 0.2, 8), M(0x2e7d32));
  vineMesh.position.set(vine.x, (vine.top + 0.2) / 2, vine.z);
  vineMesh.castShadow = true;
  scene.add(vineMesh);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M(i % 2 ? 0x43a047 : 0x66bb6a));
    const s = i % 2 ? 1 : -1;
    leaf.scale.set(1.3, 0.35, 0.8);
    leaf.rotation.z = 0.5 * s;
    leaf.position.set(vine.x, 0.3 + i * 0.34, vine.z + 0.2 * s);
    scene.add(leaf);
    if (i % 3 === 1) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), M(0xec407a));
      fl.position.set(vine.x - 0.12, 0.4 + i * 0.34, vine.z - 0.18 * s);
      scene.add(fl);
    }
  }
  platforms.push({ x: 40, z: 12, hw: 2.3, hd: 2.1, y: 3.05, id: 'house' });
  const house = new THREE.Group();
  box(house, 4.4, 0.28, 4, 0xa1887f, 40, 2.9, 12);
  [[42.15, 10.1], [42.15, 13.9], [37.85, 10.1], [37.85, 13.9], [40, 10.1], [40, 13.9], [42.15, 12]].forEach(([px, pz]) => {
    box(house, 0.12, 0.7, 0.12, 0x8d5a3b, px, 3.4, pz);
  });
  box(house, 0.08, 0.08, 3.9, 0x8d5a3b, 42.15, 3.72, 12);
  box(house, 4.4, 0.08, 0.08, 0x8d5a3b, 40, 3.72, 10.1);
  box(house, 4.4, 0.08, 0.08, 0x8d5a3b, 40, 3.72, 13.9);
  scene.add(house);
  camBlock.push(house);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.9, 8), M(0x6d4c41));
  trunk.position.set(40.8, 1.45, 12.4);
  trunk.castShadow = true;
  scene.add(trunk);
  obstacles.push({ x: 40.8, z: 12.4, r: 0.5 });

  const highPad = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.2, 14), M(0xfdd835));
  highPad.position.set(40, 3.2, 12);
  scene.add(highPad);

  const choosePads = [
    { word: 'apple', x: 29.2, z: -12 },
    { word: 'jump', x: 31.4, z: -12 },
    { word: 'banana', x: 33.6, z: -12 },
  ].map((p) => {
    const g = new THREE.Group();
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.28, 14), M(p.word === 'jump' ? 0xffc107 : 0xbcaaa4));
    stone.position.y = 0.14;
    g.add(stone);
    const icon = p.word === 'jump'
      ? new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.32, 0.14), { depth: 0.1, bevelEnabled: false }), M(0xfff59d))
      : (p.word === 'apple' ? makeApple() : makeBanana());
    icon.position.y = 0.6;
    g.add(icon);
    g.position.set(p.x, 0, p.z);
    g.visible = false;
    scene.add(g);
    return { ...p, mesh: g, shown: false, icon };
  });

  const butterflies = [];
  const wingCols = [[0xff7043, 0xffca28], [0x42a5f5, 0x80deea], [0xec407a, 0xf8bbd0], [0xab47bc, 0xce93d8], [0xffee58, 0xffffff]];
  const spots = [[-4, -4], [-1, -3], [3, 4], [-9, 2], [19.5, 6.5], [26.5, 6.5], [19.5, 16.5], [26.5, 16.5], [35, -13], [46, 11]];
  spots.forEach(([x, z], i) => {
    const [f, b] = wingCols[i % wingCols.length];
    const bf = makeButterfly(f, b, false);
    bf.root.scale.setScalar(0.9);
    bf.root.position.set(x, 1.6, z);
    scene.add(bf.root);
    butterflies.push({ mesh: bf.root, wings: bf.wings, p: rnd(i + 990) * 6, x, z });
  });

  // Friendly windmill on the village hill + honeybee hive near the orchard.
  const windmill = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.25, 3.8, 12), mat(0xfff3e0));
  tower.position.y = 1.9;
  tower.castShadow = true;
  windmill.add(tower);
  const wmRoof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.1, 12), mat(0xe53935));
  wmRoof.position.y = 4.35;
  windmill.add(wmRoof);
  const wmDoor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.12), mat(0x6d4c41));
  wmDoor.position.set(0, 0.45, 1.18);
  windmill.add(wmDoor);
  const sails = new THREE.Group();
  sails.position.set(0, 3.1, 1.02);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    box(arm, 0.1, 1.85, 0.08, 0x6d4c41, 0, 0.92, 0);
    box(arm, 0.42, 1.35, 0.04, i % 2 ? 0xffe082 : 0xffccbc, 0.22, 1.1, 0.03);
    sails.add(arm);
  }
  windmill.add(sails);
  windmill.position.set(-10, 0, -11);
  windmill.rotation.y = 0.45;
  scene.add(windmill);
  camBlock.push(windmill);
  obstacles.push({ x: -10, z: -11, r: 1.35 });

  return {
    obstacles, platforms, items, animals, actors, bubbles, bands, pond, duck,
    waters: [
      { kind: 'stream', x: 8, z: 3, hw: 1.75, hd: 26.8, floor: -1.3, surface: -0.04 },
      { kind: 'pond', x: pond.x, z: pond.z, r: pond.r - 0.25, floor: -2.5, surface: -0.04 },
    ],
    geyser, kelp, fish, geyserBubbles, waterRipples, sunRays, sails, groundHeightAt,
    trampolines, slide, toys, trophies,
    lila, vine, bounds, camBlock, sky, clouds, skyDecor, waterBubbles, waterTex, choosePads, butterflies, secret,
    shop: { x: -6, z: -8, r: 2.3 }, gate: { x: 14.2, z: 0, r: 2.6 },
    highPad: { x: 40, z: 12, y: 3.05 },
  };
}

export function tickWorld(world, dt, time) {
  world.actors.forEach((a) => { if (a.mixer) a.mixer.update(dt); });
  world.waterTex.offset.y -= dt * 0.18;
  world.clouds.rotation.y += dt * 0.004;
  if (world.sails) world.sails.rotation.z -= dt * 0.7;
  if (world.trampolines) {
    world.trampolines.forEach((tr) => {
      if (tr.bounce > 0) {
        tr.bounce = Math.max(0, tr.bounce - dt * 4);
        const s = 1 + Math.sin(tr.bounce * Math.PI * 3) * 0.28 * tr.bounce;
        tr.cap.scale.set(s, 1 / s, s);
      } else {
        tr.cap.scale.set(1, 1, 1);
      }
    });
  }
  if (world.kelp) {
    world.kelp.forEach((k) => {
      k.mesh.rotation.z = Math.sin(time * 2.1 + k.phase) * 0.22;
      k.mesh.rotation.x = Math.cos(time * 1.6 + k.phase) * 0.12;
    });
  }
  if (world.fish) {
    world.fish.forEach((f) => {
      const a = time * f.sp + f.phase;
      const nx = f.cx + Math.cos(a) * f.rx;
      const nz = f.cz + Math.sin(a) * f.rz;
      const dx = -Math.sin(a) * f.rx * f.sp;
      const dz = Math.cos(a) * f.rz * f.sp;
      f.mesh.position.set(nx, f.y + Math.sin(time * 3 + f.phase) * 0.06, nz);
      f.mesh.rotation.y = Math.atan2(dx, dz);
      f.tail.rotation.y = Math.sin(time * 12 + f.phase) * 0.45;
    });
  }
  if (world.sunRays) {
    world.sunRays.forEach((sr) => {
      sr.mesh.position.x = sr.baseX + Math.sin(time * 0.9 + sr.phase) * 0.22;
      sr.mesh.rotation.y = time * 0.25 + sr.phase;
    });
  }
  if (world.geyserBubbles && world.geyser) {
    const gy = world.geyser.y;
    const span = Math.max(0.4, -0.05 - gy);
    world.geyserBubbles.forEach((b, i) => {
      const p = (b.off + time * 0.55) % 1;
      const ang = time * 3 + i * 1.3;
      b.mesh.position.set(
        world.geyser.x + Math.cos(ang) * 0.18 * p,
        gy + 0.1 + p * span,
        world.geyser.z + Math.sin(ang) * 0.18 * p,
      );
      b.mesh.scale.setScalar(0.7 + p * 0.7);
    });
  }
  world.items.forEach((it) => {
    if (it.kind === 'coin' && it.alive) {
      it.mesh.rotation.y += dt * 2.4;
      it.mesh.position.y = it.baseY + Math.sin(time * 3 + it.x) * 0.08;
    }
    if (it.kind === 'fruit' && it.alive) {
      if (it.dropping) {
        it.vy -= 18 * dt;
        it.y += it.vy * dt;
        if (it.y < 0.45) { it.y = 0.45; it.dropping = false; }
        it.mesh.position.y = it.y;
      } else {
        it.mesh.position.y = it.y + Math.sin(time * 2 + it.x) * 0.05;
        it.mesh.rotation.y += dt;
      }
    }
    if (it.kind === 'flower' && it.alive) {
      it.mesh.rotation.y = Math.sin(time + it.x) * 0.15;
    }
    if (!it.alive && it.respawn && time > it.respawn) {
      it.alive = true;
      it.mesh.visible = true;
      if (it.kind === 'fruit') it.y = it.baseY;
      if (it.kind === 'mushroom' && it.baseScale) it.mesh.scale.setScalar(it.baseScale);
    }
  });
  world.choosePads.forEach((p) => { if (p.shown) p.icon.rotation.y += dt * 1.5; });
  world.animals.forEach((an) => {
    if (an.duck) {
      an.x = world.pond.x + Math.sin(time * 0.45) * 1.6;
      an.z = world.pond.z + Math.cos(time * 0.35) * 1.1;
      an.actor.root.position.set(an.x, 0.15 + Math.sin(time * 2) * 0.04, an.z);
      an.actor.root.rotation.y = time * 0.45 + Math.PI / 2;
      return;
    }
    if (an.wander && !an.actor.busy) {
      const target = an.wander[an.wi];
      const dx = target[0] - an.x;
      const dz = target[1] - an.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.25) {
        playLoop(an.actor, 'idle');
        if (an.oneWay) {
          an.wander = null;
          an.oneWay = false;
          an.speed = 1.15;
          an.actor.root.rotation.y = -Math.PI / 2;
          return;
        }
        an.wi = (an.wi + 1) % an.wander.length;
      } else {
        const step = Math.min(d, an.speed * dt);
        an.x += (dx / d) * step;
        an.z += (dz / d) * step;
        an.actor.root.position.x = an.x;
        an.actor.root.position.z = an.z;
        an.actor.root.rotation.y = Math.atan2(dx, dz);
        playLoop(an.actor, an.speed > 2 ? 'run' : 'walk');
      }
    }
  });
  world.bubbles.forEach((b) => {
    if (b.popped) return;
    b.mesh.position.y = b.y + Math.sin(time * 1.6 + b.index) * 0.12;
    b.cub.rotation.y += dt * 0.4;
    b.orbit.rotation.y += dt * 1.2;
  });
  world.butterflies.forEach((b) => {
    b.p += dt;
    const flap = Math.sin(time * 13 + b.p) * 0.9;
    b.wings[0].rotation.z = flap;
    b.wings[1].rotation.z = -flap;
    const nx = b.x + Math.sin(b.p * 0.7) * 1.6;
    const nz = b.z + Math.cos(b.p * 0.5) * 1.3;
    b.mesh.rotation.y = Math.atan2(nx - b.mesh.position.x, nz - b.mesh.position.z);
    b.mesh.position.set(nx, 1.2 + Math.sin(b.p * 1.7) * 0.35, nz);
  });
}

export function placeAnimal(an, x, z, faceX, faceZ) {
  an.x = x;
  an.z = z;
  an.actor.root.position.set(x, an.y, z);
  an.actor.root.rotation.y = Math.atan2(faceX - x, faceZ - z);
}

/** Walk once to (x, z), then stand still. */
export function sendAnimal(an, x, z, speed) {
  an.wander = [[x, z]];
  an.wi = 0;
  an.oneWay = true;
  an.speed = speed;
}

export function faceAnimal(an, px, pz) {
  an.actor.root.rotation.y = Math.atan2(px - an.x, pz - an.z);
  greet(an.actor);
}

export function dropFruit(it) {
  if (!it.alive || it.dropping || it.y < 0.7) return;
  it.dropping = true;
  it.vy = 0.2;
}
