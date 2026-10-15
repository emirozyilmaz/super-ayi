import * as THREE from 'three';
import { HATS } from './lines.js';

let toonGradient = null;

export function toonMat(color) {
  if (!toonGradient) {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 1;
    const x = c.getContext('2d');
    x.fillStyle = '#6a6a78'; x.fillRect(0, 0, 1, 1);
    x.fillStyle = '#b9b9c6'; x.fillRect(1, 0, 1, 1);
    x.fillStyle = '#ffffff'; x.fillRect(2, 0, 2, 1);
    toonGradient = new THREE.CanvasTexture(c);
    toonGradient.magFilter = THREE.NearestFilter;
    toonGradient.minFilter = THREE.NearestFilter;
    toonGradient.colorSpace = THREE.NoColorSpace;
  }
  return new THREE.MeshToonMaterial({ color, gradientMap: toonGradient });
}

function mesh(geo, color, parent) {
  const m = new THREE.Mesh(geo, toonMat(color));
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Original round bear, about 1.25 m tall, with a hat socket. */
export function makeBear() {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const fur = 0xc68642;
  const dark = 0x8a4b24;
  const belly = 0xffe0c2;
  const parts = {};

  const body = mesh(new THREE.SphereGeometry(0.42, 22, 16), fur, g);
  body.scale.set(1.05, 0.92, 0.9);
  body.position.y = 0.62;
  parts.body = body;
  const tum = mesh(new THREE.SphereGeometry(0.3, 16, 12), belly, g);
  tum.scale.set(0.95, 0.8, 0.55);
  tum.position.set(0, 0.55, 0.22);

  const hips = new THREE.Group();
  g.add(hips);
  parts.legs = [0, 1].map((i) => {
    const leg = new THREE.Group();
    leg.position.set(i === 0 ? -0.16 : 0.16, 0.38, 0);
    hips.add(leg);
    const thigh = mesh(new THREE.SphereGeometry(0.12, 12, 10), fur, leg);
    thigh.scale.set(1, 1.35, 1);
    thigh.position.y = -0.12;
    mesh(new THREE.SphereGeometry(0.1, 10, 8), dark, leg).position.y = -0.32;
    return leg;
  });

  parts.arms = [0, 1].map((i) => {
    const arm = new THREE.Group();
    arm.position.set(i === 0 ? -0.4 : 0.4, 0.78, 0.02);
    g.add(arm);
    const upper = mesh(new THREE.SphereGeometry(0.11, 12, 10), fur, arm);
    upper.scale.set(1, 1.45, 1);
    upper.position.y = -0.12;
    mesh(new THREE.SphereGeometry(0.09, 10, 8), belly, arm).position.set(0, -0.3, 0.02);
    return arm;
  });

  const head = new THREE.Group();
  head.position.set(0, 1.12, 0.04);
  g.add(head);
  parts.head = head;
  mesh(new THREE.SphereGeometry(0.36, 22, 16), fur, head);
  const muz = mesh(new THREE.SphereGeometry(0.16, 14, 10), belly, head);
  muz.scale.set(1.15, 0.85, 1.05);
  muz.position.set(0, -0.08, 0.28);
  mesh(new THREE.SphereGeometry(0.07, 10, 8), 0x3a2415, head).position.set(0, -0.02, 0.4);

  // Bright face features with subtle self-illumination so the face is never in dark shadow.
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1e120a });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xff7da0 });
  const smileMat = new THREE.MeshBasicMaterial({ color: 0x2b140a });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff5c8a });

  // Natural cartoon-bear mouth: a short line under the nose that splits into a soft "w" smile.
  const smileGroup = new THREE.Group();
  smileGroup.position.set(0, -0.106, 0.44);
  smileGroup.rotation.x = -0.12;
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x4a2a18 });
  const philtrum = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.06, 6), lineMat);
  philtrum.position.set(0, 0.04, 0);
  smileGroup.add(philtrum);
  [-1, 1].forEach((s) => {
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0095, 6, 14, Math.PI * 0.82), lineMat);
    curl.rotation.z = Math.PI + (Math.PI * 0.09);
    curl.position.set(0.052 * s, 0.026, 0);
    smileGroup.add(curl);
  });
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), tongueMat);
  tongue.scale.set(1.3, 0.55, 0.35);
  tongue.position.set(0, -0.032, 0.004);
  tongue.visible = false;
  smileGroup.add(tongue);
  head.add(smileGroup);
  parts.smile = smileGroup;
  parts.tongue = tongue;

  // Cute snorkel & diving goggles that appear whenever the bear swims!
  const goggles = new THREE.Group();
  goggles.visible = false;
  [-1, 1].forEach((s) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.02, 8, 18), new THREE.MeshBasicMaterial({ color: 0x00d4ff }));
    rim.position.set(0.14 * s, 0.07, 0.392);
    goggles.add(rim);
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.082, 16),
      new THREE.MeshBasicMaterial({ color: 0xade8f4, transparent: true, opacity: 0.38, side: THREE.DoubleSide }),
    );
    lens.position.set(0.14 * s, 0.07, 0.4);
    goggles.add(lens);
  });
  const bridgeBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: 0x00d4ff }));
  bridgeBar.position.set(0, 0.075, 0.394);
  goggles.add(bridgeBar);
  const snorkelTube = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.38, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  snorkelTube.position.set(-0.33, 0.15, 0.16);
  goggles.add(snorkelTube);
  const snorkelTip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff595e }));
  snorkelTip.position.set(-0.33, 0.35, 0.16);
  goggles.add(snorkelTip);
  parts.snorkel = [snorkelTube, snorkelTip];
  head.add(goggles);
  parts.goggles = goggles;

  [-1, 1].forEach((s) => {
    const ear = mesh(new THREE.SphereGeometry(0.12, 12, 10), fur, head);
    ear.position.set(0.22 * s, 0.28, -0.02);
    const inner = mesh(new THREE.SphereGeometry(0.07, 10, 8), 0xf2a3b0, head);
    inner.position.set(0.22 * s, 0.28, 0.04);
  });

  const eyes = new THREE.Group();
  head.add(eyes);
  parts.eyes = eyes;
  // Big glossy black eyes with two sparkles: wide awake and friendly (no sleepy eyelids).
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.066, 14, 12), pupilMat);
    eye.scale.set(0.95, 1.18, 0.62);
    eye.position.set(0.14 * s, 0.065, 0.335);
    eyes.add(eye);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), whiteMat);
    spark.position.set((0.14 * s) + 0.016, 0.105, 0.37);
    eyes.add(spark);
    const spark2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), whiteMat);
    spark2.position.set((0.14 * s) - 0.018, 0.03, 0.372);
    eyes.add(spark2);
    const lid = mesh(new THREE.SphereGeometry(0.076, 12, 10), fur, eyes);
    lid.position.set(0.14 * s, 0.065, 0.338);
    lid.scale.set(1, 1.25, 0.8);
    lid.visible = false;
    if (!parts.lids) parts.lids = [];
    parts.lids.push(lid);
  });
  [-1, 1].forEach((s) => {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), blushMat);
    blush.scale.set(1.2, 0.85, 0.6);
    blush.position.set(0.21 * s, -0.045, 0.28);
    head.add(blush);
  });

  const tail = mesh(new THREE.SphereGeometry(0.1, 10, 8), fur, g);
  tail.position.set(0, 0.58, -0.36);

  parts.hatSocket = new THREE.Group();
  parts.hatSocket.position.set(0, 0.3, 0);
  head.add(parts.hatSocket);
  parts.eyeSocket = new THREE.Group();
  head.add(parts.eyeSocket);
  parts.backSocket = new THREE.Group();
  parts.backSocket.position.set(0, 0.78, -0.32);
  g.add(parts.backSocket);
  parts.capePivot = null;
  parts.blink = 0;
  parts.cheer = 0;
  g.userData.parts = parts;
  return g;
}

export function setHat(bear, idOrOutfit) {
  const p = bear.userData.parts;
  const outfit = (idOrOutfit && typeof idOrOutfit === 'object')
    ? idOrOutfit
    : { hat: idOrOutfit || null, eyes: null, back: null };

  while (p.hatSocket.children.length) p.hatSocket.remove(p.hatSocket.children[0]);
  while (p.eyeSocket.children.length) p.eyeSocket.remove(p.eyeSocket.children[0]);
  while (p.backSocket.children.length) p.backSocket.remove(p.backSocket.children[0]);
  p.capePivot = null;
  p.capeSegs = null;

  const hat = HATS.find((h) => h.id === outfit.hat);
  if (hat) {
    if (hat.id === 'crown') {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.12, 16), toonMat(0xffca28));
      band.position.y = 0.06;
      p.hatSocket.add(band);
      const gemCols = [0xe53935, 0x1e88e5, 0x43a047, 0xec407a, 0x8e24aa];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 6), toonMat(0xffd54f));
        spike.position.set(Math.cos(a) * 0.18, 0.18, Math.sin(a) * 0.18);
        p.hatSocket.add(spike);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), new THREE.MeshBasicMaterial({ color: gemCols[i] }));
        gem.position.set(Math.cos(a) * 0.21, 0.06, Math.sin(a) * 0.21);
        p.hatSocket.add(gem);
      }
    } else {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.36, 14), toonMat(hat.hex));
      cone.position.y = 0.16;
      cone.castShadow = true;
      p.hatSocket.add(cone);
      const brim = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), toonMat(0xfff8ef));
      brim.scale.set(1, 0.22, 1);
      brim.position.y = 0.0;
      p.hatSocket.add(brim);
      if (hat.id === 'yellow') {
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), toonMat(0xfff3c4));
        pom.position.y = 0.36;
        p.hatSocket.add(pom);
      }
    }
  }

  if (outfit.eyes === 'glasses') {
    [-1, 1].forEach((s) => {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 8, 16), toonMat(0xffca28));
      frame.position.set(0.14 * s, 0.07, 0.392);
      p.eyeSocket.add(frame);
      const glass = new THREE.Mesh(
        new THREE.CircleGeometry(0.085, 14),
        new THREE.MeshBasicMaterial({ color: 0x1e88e5, transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
      );
      glass.position.set(0.14 * s, 0.07, 0.402);
      p.eyeSocket.add(glass);
    });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.022, 0.022), toonMat(0xffca28));
    bar.position.set(0, 0.08, 0.394);
    p.eyeSocket.add(bar);
  }

  if (outfit.back === 'cape') {
    // Flowing cape: a chain of flaring segments, each hinged on the one above, so it can ripple.
    const pivot = new THREE.Group();
    pivot.position.z = -0.04;
    // Each segment is a trapezoid whose top matches the bottom of the one above: one smooth flaring sheet.
    const widths = [0.34, 0.38, 0.43, 0.49, 0.55, 0.62];
    const segH = 0.14;
    const shades = [0xe53935, 0xe03634, 0xd83231, 0xcf2f2e, 0xc62c2b];
    const segs = [];
    let parent = pivot;
    shades.forEach((shade, i) => {
      const wTop = widths[i];
      const wBot = widths[i + 1];
      const hinge = new THREE.Group();
      hinge.position.y = i === 0 ? 0 : -segH;
      const geo = new THREE.PlaneGeometry(1, segH, 1, 1);
      const pa = geo.attributes.position;
      for (let k = 0; k < pa.count; k++) pa.setX(k, Math.sign(pa.getX(k)) * (pa.getY(k) > 0 ? wTop : wBot) / 2);
      const clothMat = toonMat(shade);
      clothMat.side = THREE.DoubleSide;
      const cloth = new THREE.Mesh(geo, clothMat);
      cloth.position.y = -segH / 2;
      cloth.castShadow = i >= 3;
      hinge.add(cloth);
      if (i === 2) {
        // Gold star emblem on the back.
        const st = new THREE.Shape();
        for (let k = 0; k < 10; k++) {
          const r = k % 2 ? 0.035 : 0.085;
          const a = Math.PI / 2 + (k / 10) * Math.PI * 2;
          if (k === 0) st.moveTo(Math.cos(a) * r, Math.sin(a) * r); else st.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        const star = new THREE.Mesh(
          new THREE.ShapeGeometry(st),
          new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide }),
        );
        star.position.set(0, -segH / 2, -0.004);
        star.scale.setScalar(1.3);
        hinge.add(star);
      }
      if (i === shades.length - 1) {
        const trim = new THREE.Mesh(new THREE.PlaneGeometry(wBot, 0.03), new THREE.MeshBasicMaterial({ color: 0xffca28, side: THREE.DoubleSide }));
        trim.position.set(0, -segH + 0.015, 0.001);
        hinge.add(trim);
      }
      parent.add(hinge);
      segs.push(hinge);
      parent = hinge;
    });
    p.capeSegs = segs;
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 16, Math.PI), toonMat(0xffca28));
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.02, 0.14);
    pivot.add(collar);
    p.backSocket.add(pivot);
    p.capePivot = pivot;
  } else if (outfit.back === 'pack') {
    const bag = new THREE.Group();
    const main = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.24), toonMat(0x8d5a3b));
    main.position.set(0, -0.14, -0.04);
    main.castShadow = true;
    bag.add(main);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.26), toonMat(0xffb74d));
    flap.position.set(0, 0.05, -0.04);
    bag.add(flap);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.04), toonMat(0xffca28));
    buckle.position.set(0, -0.02, -0.17);
    bag.add(buckle);
    p.backSocket.add(bag);
  }
}

export function cheerBear(bear) {
  bear.userData.parts.cheer = 0.9;
}

export function updateBear(bear, dt, pl, moving) {
  const p = bear.userData.parts;
  const t = performance.now() / 1000;
  const airborne = !pl.onG && !pl.climbing && !pl.swimming;
  // Real ground speed drives the gait, so slow steps look slow and fast steps look fast.
  const ud = bear.userData;
  if (ud.lx === undefined) { ud.lx = pl.x; ud.lz = pl.z; ud.spd = 0; ud.stride = 0; ud.lean = 0; }
  const inst = dt > 0 ? Math.hypot(pl.x - ud.lx, pl.z - ud.lz) / dt : 0;
  ud.lx = pl.x; ud.lz = pl.z;
  ud.spd += (Math.min(inst, 9) - ud.spd) * Math.min(1, dt * 9);
  const spd = ud.spd;
  ud.stride += spd * dt * 2.2;
  const run = moving && pl.onG && !pl.climbing && !pl.swimming && spd > 0.3;
  const amp = Math.min(0.8, 0.22 + spd * 0.12);
  const sw = run ? Math.sin(ud.stride) * amp : (pl.climbing ? 0.4 : Math.sin(t * 2) * 0.08);
  p.legs[0].rotation.x = sw;
  p.legs[1].rotation.x = -sw;
  if (p.cheer > 0) {
    p.cheer -= dt;
    p.arms[0].rotation.x = -2.4;
    p.arms[1].rotation.x = -2.4;
    p.arms[0].rotation.z = 0.4;
    p.arms[1].rotation.z = -0.4;
  } else if (pl.swinging) {
    // Seated on the swing: hands on the ropes, legs pumping with the motion.
    const w = Math.min(1, Math.abs(pl.swinging.omega) / 2.2);
    const kick = Math.sin(t * 8) * 0.28 * w;
    p.arms[0].rotation.x = -2.35;
    p.arms[1].rotation.x = -2.35;
    p.arms[0].rotation.z = 0.28;
    p.arms[1].rotation.z = -0.28;
    p.legs[0].rotation.x = -1.3 + kick;
    p.legs[1].rotation.x = -1.3 + kick;
  } else if (pl.flying) {
    // Pilot pose: paws on the controls, legs tucked forward in the cockpit.
    p.arms[0].rotation.x = -1.25;
    p.arms[1].rotation.x = -1.25;
    p.arms[0].rotation.z = 0.2;
    p.arms[1].rotation.z = -0.2;
    p.legs[0].rotation.x = -1.45;
    p.legs[1].rotation.x = -1.45;
  } else if (pl.swimming) {
    // Super Bear swim pose: horizontal belly-down stroke when submerged, dog-paddle at surface.
    const sp = moving || pl.submerged ? 9.5 : 5.2;
    const a = Math.sin(pl.swimPhase || t * sp);
    const b = Math.cos(pl.swimPhase || t * sp);
    p.arms[0].rotation.x = -1.35 + a * 1.1;
    p.arms[1].rotation.x = -1.35 - a * 1.1;
    p.arms[0].rotation.z = 0.95 + b * 0.25;
    p.arms[1].rotation.z = -0.95 - b * 0.25;
    p.legs[0].rotation.x = 0.85 + a * 0.55;
    p.legs[1].rotation.x = 0.85 - a * 0.55;
    bear.rotation.x = pl.submerged ? 0.34 : 0.12;
  } else if (pl.diving || pl.sliding) {
    // Super Bear Dive / Belly Slide pose!
    p.arms[0].rotation.x = -2.85;
    p.arms[1].rotation.x = -2.85;
    p.arms[0].rotation.z = 0.35;
    p.arms[1].rotation.z = -0.35;
    p.legs[0].rotation.x = 0.95;
    p.legs[1].rotation.x = 0.95;
    bear.rotation.x = 1.05;
  } else if (pl.stomping) {
    // Belly Stomp spread-eagle pose!
    p.arms[0].rotation.x = -1.6;
    p.arms[1].rotation.x = -1.6;
    p.arms[0].rotation.z = 1.15;
    p.arms[1].rotation.z = -1.15;
    p.legs[0].rotation.x = 0.7;
    p.legs[1].rotation.x = 0.7;
    bear.rotation.x = 0.85;
  } else if (airborne) {
    p.arms[0].rotation.x = -2.5;
    p.arms[1].rotation.x = -2.5;
    p.arms[0].rotation.z = 0.2;
    p.arms[1].rotation.z = -0.2;
    p.legs[0].rotation.x = 0.4;
    p.legs[1].rotation.x = -0.25;
  } else if (pl.climbing) {
    // Hand over hand: one paw reaches up while the opposite leg pushes.
    const a = Math.sin(pl.climbPhase || 0);
    p.arms[0].rotation.x = -2.55 + a * 0.6;
    p.arms[1].rotation.x = -2.55 - a * 0.6;
    p.arms[0].rotation.z = 0.45;
    p.arms[1].rotation.z = -0.45;
    p.legs[0].rotation.x = -0.85 - a * 0.55;
    p.legs[1].rotation.x = -0.85 + a * 0.55;
  } else {
    p.arms[0].rotation.z = 0.15;
    p.arms[1].rotation.z = -0.15;
    p.arms[0].rotation.x = -sw * 0.8;
    p.arms[1].rotation.x = sw * 0.8;
  }
  if (!pl.swimming && !pl.diving && !pl.sliding && !pl.stomping && !pl.swinging && !pl.flying) {
    // Gentle forward lean and a little waddle while running.
    const wantLean = run ? Math.min(0.16, spd * 0.035) : 0;
    ud.lean += (wantLean - ud.lean) * Math.min(1, dt * 7);
    bear.rotation.x = ud.lean;
    bear.rotation.z = run ? Math.sin(ud.stride) * Math.min(0.07, spd * 0.015) : 0;
  } else {
    bear.rotation.z = 0;
  }
  if (p.capePivot) {
    // Wind catches the cape: stronger when running fast, in the air or diving.
    const wind = (pl.diving || pl.sliding) ? 0.9 : airborne ? 0.6 : run ? Math.min(0.7, 0.14 + spd * 0.1) : 0.05;
    p.capePivot.rotation.x = 0.1 + wind * 0.5;
    if (p.capeSegs) {
      p.capeSegs.forEach((s, i) => {
        const lag = t * (6 + wind * 6) - i * 0.9;
        s.rotation.x = 0.06 + Math.sin(lag) * 0.07 * (0.3 + wind) + wind * 0.07;
        s.rotation.z = Math.sin(lag * 0.8 + 1.3) * 0.045 * (0.3 + wind) * (i > 0 ? 1 : 0);
      });
    }
  }
  const breathe = 1 + Math.sin(t * 2.2) * 0.02;
  const squash = 1 - pl.squash * 0.18;
  p.body.scale.y = 0.92 * breathe * squash;
  const bob = run ? Math.abs(Math.sin(ud.stride)) * Math.min(0.045, spd * 0.01) : 0;
  p.head.position.y = 1.12 + Math.sin(t * 2.2) * 0.02 + (p.cheer > 0 ? 0.06 : 0) + bob;
  p.head.rotation.x = pl.climbing ? -0.35 : (pl.swimming ? (pl.submerged ? -0.42 : -0.12) : 0);
  if (p.smile) p.smile.scale.setScalar(p.cheer > 0 ? 1.15 : 1);
  if (p.tongue) p.tongue.visible = p.cheer > 0;
  if (p.goggles) p.goggles.visible = !!pl.swimming || !!pl.flying;
  if (p.snorkel) p.snorkel.forEach((m) => { m.visible = !!pl.swimming; });
  if (p.eyeSocket) p.eyeSocket.visible = !pl.swimming;
  p.blink -= dt;
  if (p.blink < 0) p.blink = 2.4 + Math.random() * 2.5;
  const blinking = p.blink < 0.11;
  p.lids.forEach((lid) => {
    lid.visible = blinking;
    lid.scale.y = blinking ? 1 : 0.05;
  });
  bear.position.set(pl.x, pl.y, pl.z);
  bear.rotation.y = pl.yaw;
}
