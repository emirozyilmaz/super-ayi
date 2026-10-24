import * as THREE from 'three';
import { itemIcon } from './icons.js';

/*
 * Word of the day: three glowing tokens with one word's picture, hidden around the garden.
 * Each has a soft light beam so a child can spot it from afar. Walking into one collects it.
 * (The daily choice of word and the rewards live in quest.js; this file is only the 3D side.)
 */
const N = 3;

function iconTexture(svg) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  x.fillStyle = '#ffffff';
  x.beginPath();
  x.arc(128, 128, 118, 0, Math.PI * 2);
  x.fill();
  x.lineWidth = 14;
  x.strokeStyle = '#ffd54f';
  x.stroke();
  const img = new Image();
  img.onload = () => {
    x.drawImage(img, 38, 38, 180, 180);
    tex.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return tex;
}

export function makeHunt(scene) {
  const tokens = [];
  const beamGeo = new THREE.CylinderGeometry(0.35, 0.6, 8, 16, 1, true);
  const ringGeo = new THREE.RingGeometry(0.7, 0.95, 32);
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group();
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    sprite.scale.setScalar(1.15);
    sprite.position.y = 1.25;
    g.add(sprite);
    const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
      color: 0xfff59d, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }));
    beam.position.y = 4;
    g.add(beam);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    g.add(ring);
    g.visible = false;
    scene.add(g);
    tokens.push({ group: g, sprite, beam, ring, x: 0, z: 0, alive: false, pop: 0, phase: i * 2.1 });
  }
  return { tokens, word: '', onCollect: () => {} };
}

/** Show the tokens that are not collected yet. spots[i] = {x, z}; got[i] = already found. */
export function setHunt(h, word, spots, got) {
  h.word = word;
  const tex = iconTexture(itemIcon(word));
  h.tokens.forEach((t, i) => {
    const s = spots[i];
    t.alive = !!s && !got[i];
    t.pop = 0;
    t.group.visible = t.alive;
    if (!s) return;
    t.x = s.x;
    t.z = s.z;
    t.group.position.set(s.x, 0, s.z);
    t.group.scale.setScalar(1);
    t.sprite.material.map = tex;
    t.sprite.material.needsUpdate = true;
  });
}

export function hideHunt(h) {
  h.tokens.forEach((t) => { t.alive = false; t.group.visible = false; });
}

/** Per frame. Collect a token when the bear walks into it (on foot, not flying). */
export function tickHunt(h, dt, time, pl) {
  h.tokens.forEach((t, i) => {
    if (!t.group.visible) return;
    if (t.pop > 0) {
      t.pop += dt;
      t.group.scale.setScalar(1 + t.pop * 3);
      t.sprite.material.opacity = Math.max(0, 1 - t.pop * 3);
      if (t.pop > 0.35) { t.group.visible = false; t.sprite.material.opacity = 1; }
      return;
    }
    t.sprite.position.y = 1.25 + Math.sin(time * 2 + t.phase) * 0.12;
    t.beam.material.opacity = 0.16 + Math.sin(time * 3 + t.phase) * 0.06;
    t.ring.scale.setScalar(1 + Math.sin(time * 4 + t.phase) * 0.08);
    if (!t.alive || pl.flying || pl.swinging) return;
    if (Math.hypot(pl.x - t.x, pl.z - t.z) < 1.25 && pl.y < 2.2) {
      t.alive = false;
      t.pop = 0.001;
      h.onCollect(i, t);
    }
  });
}
