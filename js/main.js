import * as THREE from 'three';
import { S, G, IN, PL } from './state.js';
import { writeSave } from './save.js';
import {
  initAudio, unlockAudio, hush, sfx, preloadVoices, say, speaking, audioCtx, musicBus, applyVolumes,
} from './audio.js';
import { loadModels } from './assets.js';
import { makeBear, setHat, updateBear, cheerBear } from './bear.js';
import { buildWorld, tickWorld } from './world.js';
import { tickToys, AIRFIELD } from './toys.js';
import { bindKeys, updatePlayer, updateCamera, releaseKeys } from './player.js';
import {
  bindQuest, startSession, nextTalk, interact, guideTarget, guideMarks,
  tickQuest, replayInstruction, closeShop, renderParent, starsLabel,
  finaleFree, finaleReplay, resumeQuest, recordAnswer, markWord, STEPS,
} from './quest.js';
import { makeGuide, updateGuide, burst } from './guide.js';
import { itemIcon } from './icons.js';
import { LINES } from './lines.js';
import { batchStatic, batchRigid } from './batch.js';
import { makeBalloons, tickBalloons } from './balloons.js';
import { makeHideBush, tickHide } from './hide.js';
import { bindAlbum, bindAlbumUi, openAlbum, closeAlbum } from './album.js';
import { initMusic, startMusic, tickMusic } from './music.js';
import { addPlayTime, limitState, grantExtra } from './stats.js';
import { PROFILES, currentProfile, displayName, selectProfile, peekProgress } from './profiles.js';
import { speakOpen, cancelSpeak } from './speak.js';
import { makeHunt, tickHunt } from './wordhunt.js';
import { bindDaily, startDaily, tickDaily, replayDaily } from './daily.js';
import { bindFamily, renderFamily } from './family.js';

export const APP_VERSION = '2026.10.24';

const $ = (id) => document.getElementById(id);

const renderer = new THREE.WebGLRenderer({ canvas: $('cv'), antialias: true });
// Touch screens (tablets/phones) are capped a little lower: they have dense screens and small GPUs.
const TOUCH = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, TOUCH ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd6f5);
scene.fog = new THREE.Fog(0xdff3fb, 70, 230);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 320);

const hemi = new THREE.HemisphereLight(0xfff4e0, 0x7cc46a, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff6e8, 1.15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.camera.left = -22;
sun.shadow.camera.right = 22;
sun.shadow.camera.top = 22;
sun.shadow.camera.bottom = -22;
scene.add(sun);
scene.add(sun.target);

const guide = makeGuide(scene);
G.burst = (x, y, z, c) => burst(guide, x, y, z, c ?? null);

let bear;
let world;
let moving = false;

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function paintHud() {
  $('hudCoins').textContent = String(S.coins);
  $('hudStars').textContent = starsLabel();
  $('hudFriends').textContent = `${S.rescues}/3`;
  if (world && world.trophies) {
    const score = S.rescues + Math.floor(S.quest / 5);
    world.trophies.forEach((t, i) => { t.visible = i < Math.max(1, score); });
  }
}

const proj = new THREE.Vector3();
function toScreen(x, y, z) {
  proj.set(x, y, z).project(camera);
  return { x: (proj.x + 1) / 2 * innerWidth, y: (1 - proj.y) / 2 * innerHeight, ok: proj.z < 1 };
}

/** The picked item flies into its slot on the mission card. */
function flyToMission(it, slot) {
  const target = document.querySelector(`#misIcons .ico[data-i="${slot}"]`);
  if (!target) return;
  const from = toScreen(it.x, it.y + 0.6, it.z);
  const sx = from.ok ? from.x : innerWidth / 2;
  const sy = from.ok ? from.y : innerHeight / 2;
  const r = target.getBoundingClientRect();
  const size = 64;
  const tx = r.left + r.width / 2 - size / 2;
  const ty = r.top + r.height / 2 - size / 2;
  const el = document.createElement('div');
  el.className = 'fly';
  el.innerHTML = itemIcon(it.word);
  document.body.appendChild(el);
  target.classList.add('empty');
  const anim = el.animate([
    { transform: `translate(${sx - size / 2}px, ${sy - size / 2}px) scale(1.3)` },
    { transform: `translate(${(sx + tx) / 2}px, ${Math.min(sy, ty) - 60}px) scale(1.6)`, offset: 0.4 },
    { transform: `translate(${tx}px, ${ty}px) scale(${r.width / size})` },
  ], { duration: 850, easing: 'cubic-bezier(.45,0,.35,1)' });
  anim.onfinish = () => {
    el.remove();
    target.classList.remove('empty', 'pop');
    void target.offsetWidth;
    target.classList.add('pop');
    sfx.coin();
  };
}

/** Rescued cubs walk behind the bear in a little line. */
const followers = [];
function addFollower(b) {
  const cub = b.cub;
  const wp = new THREE.Vector3();
  cub.getWorldPosition(wp);
  scene.attach(cub);
  cub.visible = true;
  followers.push({ cub, pl: { x: wp.x, y: wp.y, z: wp.z, vy: 3, yaw: 0, onG: false, climbing: null, squash: 0 } });
}

function updateFollowers(dt) {
  if (PL.flying) {
    // The cubs wait at the airfield while the bear flies.
    followers.forEach((f) => { f.cub.visible = false; f.pl.x = PL.x; f.pl.z = PL.z; f.pl.y = 0; f.pl.vy = 0; });
    return;
  }
  followers.forEach((f, i) => {
    if (!f.cub.visible) {
      f.cub.visible = true;
      f.pl.x = PL.x - 1.0 * (i + 1);
      f.pl.z = PL.z - 0.6;
      f.pl.y = 0;
      f.pl.vy = 0;
    }
    const lead = i === 0 ? PL : followers[i - 1].pl;
    const dx = lead.x - f.pl.x;
    const dz = lead.z - f.pl.z;
    const d = Math.hypot(dx, dz);
    let moving = false;
    if (d > 16) {
      f.pl.x = lead.x - 1.2;
      f.pl.z = lead.z;
    } else if (d > 1.4) {
      const sp = Math.min(5.2, (d - 1.2) * 3);
      f.pl.x += (dx / d) * sp * dt;
      f.pl.z += (dz / d) * sp * dt;
      f.pl.yaw = Math.atan2(dx, dz);
      moving = sp > 0.6;
    }
    for (const o of world.obstacles) {
      if (o.off || o.aboveWater) continue;
      if (o.box) {
        const nx = Math.max(o.x - o.hw, Math.min(f.pl.x, o.x + o.hw));
        const nz = Math.max(o.z - o.hd, Math.min(f.pl.z, o.z + o.hd));
        const bx = f.pl.x - nx;
        const bz = f.pl.z - nz;
        const bd = Math.hypot(bx, bz);
        if (bd < 0.3 && bd > 1e-4) {
          f.pl.x = nx + (bx / bd) * 0.3;
          f.pl.z = nz + (bz / bd) * 0.3;
        } else if (bd <= 1e-4) {
          f.pl.x = lead.x; f.pl.z = lead.z; // stuck inside a box: hop to the bear
        }
        continue;
      }
      const ox = f.pl.x - o.x;
      const oz = f.pl.z - o.z;
      const od = Math.hypot(ox, oz);
      const rr = o.r + 0.25;
      if (od < rr && od > 1e-4) {
        f.pl.x = o.x + (ox / od) * rr;
        f.pl.z = o.z + (oz / od) * rr;
      }
    }
    f.pl.vy -= 20 * dt;
    f.pl.y += f.pl.vy * dt;
    if (f.pl.y <= 0) { f.pl.y = 0; f.pl.vy = 0; f.pl.onG = true; } else f.pl.onG = false;
    updateBear(f.cub, dt, f.pl, moving);
  });
}

function hopFollowers() {
  followers.forEach((f, i) => {
    setTimeout(() => {
      cheerBear(f.cub);
      if (f.pl.onG) f.pl.vy = 5.5;
    }, i * 140);
  });
}

const effects = {
  collect(it, slot) {
    burst(guide, it.x, it.y + 0.5, it.z, it.hl ?? null);
    if (slot >= 0) flyToMission(it, slot);
  },
  pop(b) {
    burst(guide, b.x, b.y, b.z, 0xce93d8);
    burst(guide, b.x, b.y + 0.4, b.z, null);
    addFollower(b);
  },
  cheer() {
    burst(guide, PL.x, PL.y + 1.4, PL.z, null);
    hopFollowers();
  },
  finale() {
    for (let i = 0; i < 9; i++) {
      setTimeout(() => {
        const a = Math.random() * Math.PI * 2;
        burst(guide, PL.x + Math.cos(a) * 2.2, PL.y + 1.5 + Math.random() * 1.5, PL.z + Math.sin(a) * 2.2, null);
        if (i % 3 === 0) hopFollowers();
      }, i * 260);
    }
  },
};

function bootStepFromUrl() {
  const q = new URLSearchParams(location.search);
  const n = q.get('step');
  if (n === null || n === '') return;
  S.quest = Math.min(STEPS.length - 1, Math.max(0, parseInt(n, 10) || 0));
  // Friends rescued in the steps before this one (so the bubbles and HUD agree with the jump).
  S.rescues = STEPS.slice(0, S.quest).filter((st) => st.type === 'rescue').length;
}

/*
 * Offline copy (PWA): only on a real web address. On this computer's own server (oyna.bat)
 * files must always load fresh, so it is skipped there unless ?pwa=1.
 * The voices are preloaded once the offline worker controls the page, so on the very first
 * visit they are downloaded (and stored) once, not twice.
 */
const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const USE_SW = 'serviceWorker' in navigator && (!LOCAL || new URLSearchParams(location.search).has('pwa'));
const swControl = new Promise((resolve) => {
  if (!USE_SW || navigator.serviceWorker.controller) { resolve(); return; }
  navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
  setTimeout(resolve, 8000);
});
if (USE_SW) navigator.serviceWorker.register('./sw.js').catch(() => { /* plays online only */ });

async function boot() {
  await initAudio();
  bindKeys();
  bootStepFromUrl();
  const models = await loadModels((p) => { $('loadBar').style.width = `${Math.round(p * 100)}%`; });
  swControl.then(() => preloadVoices());
  const before = [...scene.children];
  world = buildWorld(scene, models);
  if (!new URLSearchParams(location.search).has('nobatch')) {
    // Everything the game moves, hides or reads later stays a separate mesh; the rest is merged.
    const { camBlock, obstacles, platforms, bands, waters, ...moving } = world;
    world.batchInfo = batchStatic(scene, moving, before);
    // Things that only move as a whole: merge their parts inside them.
    let rigid = batchRigid(world.clouds) + batchRigid(world.skyDecor);
    world.items.forEach((it) => { if (!it.actor && it.mesh) rigid += batchRigid(it.mesh); });
    world.batchInfo.rigid = rigid;
  }
  // Chapter 4 and 5 props are made after batching: they move and hide.
  world.balloons = makeBalloons(scene);
  world.hideBush = makeHideBush(scene);
  world.hunt = makeHunt(scene);
  world.keepClear = [
    { x: AIRFIELD.pad.x, z: AIRFIELD.pad.z, r: AIRFIELD.pad.r + 1.2 },
    ...world.toys.swings.map((sw) => ({ x: sw.x, z: sw.z, r: 1.8 })),
    { x: world.vine.x, z: world.vine.z, r: 1.4 },
  ];
  bear = makeBear();
  setHat(bear, S.outfit || S.hat);
  scene.add(bear);
  bindQuest(world, bear, paintHud, effects);
  bindAlbum((word, firstTry) => { recordAnswer(word, firstTry, true); paintHud(); });
  bindDaily(world, markWord, paintHud);
  bindFamily(renderParent);
  world.bubbles.forEach((b) => {
    if (b.index >= S.rescues) return;
    b.popped = true;
    b.mesh.visible = false;
    addFollower(b);
    const f = followers[followers.length - 1];
    f.pl.x = PL.x - 1.2 * (b.index + 1);
    f.pl.z = PL.z;
    f.pl.y = 0;
  });
  $('load').classList.add('hidden');
  G.ready = true;
  window.__gameReady = true;
  renderKidPick();
  const q = new URLSearchParams(location.search);
  if (q.has('debug')) window.__dbg = { scene, camera, world, bear, renderer, G, PL, S, THREE, followers };
  if (q.get('autostart') === '1') startGame();
  else $('menu').classList.remove('hidden');
}

function startGame() {
  if (G.started) return;
  unlockAudio();
  const ac = audioCtx();
  if (ac) { initMusic(ac, musicBus()); startMusic(); }
  G.started = true;
  G.time = 0;
  $('menu').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('controls').classList.remove('hidden');
  startSession(new URLSearchParams(location.search).has('review'));
  startDaily();
  paintHud();
  if (limitState() === 'over') showRest();
}

/* ---- Profiles on the menu ---------------------------------------------------------------- */

function renderKidPick() {
  const box = $('kidPick');
  box.innerHTML = '';
  // A single child with no name yet: the plain title screen is enough.
  if (PROFILES.list.length === 1 && !PROFILES.list[0].name) return;
  PROFILES.list.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `kid-card${p.id === PROFILES.current ? ' on' : ''}`;
    b.innerHTML = `<span>${p.avatar}</span><b></b><small>⭐ ${peekProgress(p.id).learned}</small>`;
    b.querySelector('b').textContent = displayName(p, i);
    b.addEventListener('click', () => {
      if (p.id === PROFILES.current) return;
      selectProfile(p.id);
      location.reload();
    });
    box.appendChild(b);
  });
}

/* ---- Daily play limit -------------------------------------------------------------------- */

let warnedToday = false;
let limitCheck = 0;

function showRest() {
  if (!$('rest').classList.contains('hidden')) return;
  pauseGame('rest');
  say('break-time');
}

function checkLimit(dt) {
  limitCheck += dt;
  if (limitCheck < 1) return;
  limitCheck = 0;
  const st = limitState();
  if (st === 'warn' && !warnedToday) {
    warnedToday = true;
    say('almost-time', { soft: true });
  }
  if (st === 'over' && !G.lock) showRest();
}

/** Pause stops the game clock, the quest timers and the voice; panelId is the screen to show. */
function clearInput() {
  IN.x = 0; IN.y = 0;
  IN.jumpBuf = 0; IN.diveBuf = 0;
  IN.jumpHeld = false; IN.diveHeld = false;
  IN.camDrag = 0;
  releaseKeys();
}

function pauseGame(panelId) {
  G.paused = true;
  hush();
  cancelSpeak();
  clearInput();
  if (panelId) $(panelId).classList.remove('hidden');
}

function resumeGame() {
  $('pause').classList.add('hidden');
  unlockAudio();
  clearInput();
  G.paused = false;
  resumeQuest();
}

const PANELS = ['gate', 'parent', 'album', 'rest', 'speak'];
const panelOpen = () => PANELS.some((id) => !$(id).classList.contains('hidden'));

function bindUi() {
  $('btnPlay').addEventListener('click', () => { sfx.click(); startGame(); });
  $('dlgNext').addEventListener('pointerdown', (e) => { e.preventDefault(); nextTalk(); });
  $('mission').addEventListener('pointerdown', (e) => { e.preventDefault(); unlockAudio(); replayInstruction(); });
  $('chooseSay').addEventListener('pointerdown', (e) => { e.preventDefault(); replayInstruction(); });
  $('btnFree').addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.click(); finaleFree(); });
  $('btnReplay').addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.click(); finaleReplay(); });
  // Held buttons capture their finger, so sliding off a button can't leave it "held" for ever
  // (a stuck dive would keep the bear underwater).
  const holdButton = (el, onDown, onUp) => {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      unlockAudio();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      onDown();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, onUp));
  };
  holdButton($('btnJump'), () => { IN.jumpBuf = 0.14; IN.jumpHeld = true; }, () => { IN.jumpHeld = false; });
  holdButton($('btnDive'), () => { IN.diveBuf = 0.18; IN.diveHeld = true; }, () => { IN.diveHeld = false; });
  // Switching apps / windows releases everything that was held.
  addEventListener('blur', clearInput);
  $('huntChip').addEventListener('click', () => { if (!G.paused) replayDaily(); });
  const joy = $('joy');
  const knob = $('joyKnob');
  let jid = null;
  function setJoy(e) {
    const r = joy.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    IN.x = dx; IN.y = dy;
    knob.style.left = `${50 + dx * 32}%`;
    knob.style.top = `${50 + dy * 32}%`;
  }
  joy.addEventListener('pointerdown', (e) => {
    e.preventDefault(); unlockAudio();
    jid = e.pointerId;
    try { joy.setPointerCapture(jid); } catch (err) { /* ignore */ }
    setJoy(e);
  });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) setJoy(e); });
  const rel = (e) => {
    if (e.pointerId !== jid) return;
    jid = null; IN.x = 0; IN.y = 0;
    knob.style.left = '50%'; knob.style.top = '50%';
  };
  joy.addEventListener('pointerup', rel);
  joy.addEventListener('pointercancel', rel);

  let cid = null;
  let lastX = 0;
  addEventListener('pointerdown', (e) => {
    if (!G.started || e.target.closest('button, #joy, .panel, #dlg, #choose')) return;
    if (e.clientX < innerWidth * 0.55) return;
    cid = e.pointerId; lastX = e.clientX;
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerId !== cid) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    G.camYaw -= dx * 0.008;
    G.lastInput = G.time;
  });
  const endCam = (e) => { if (e.pointerId === cid) cid = null; };
  addEventListener('pointerup', endCam);
  addEventListener('pointercancel', endCam);

  $('btnMute').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    toggleMute();
  });
  $('btnPause').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (G.started) pauseGame('pause');
  });
  $('btnResume').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    resumeGame();
  });
  // Leaving the tab or app (home button, another app) pauses the game and stops the voice.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.started && !G.paused) pauseGame('pause');
  });
  // Break screen: only a parent (through the gate) can add time.
  $('restParent').addEventListener('click', () => openGate(() => {
    grantExtra(10);
    warnedToday = false;
    $('rest').classList.add('hidden');
    resumeGame();
  }));
  // Parent gate: a sum a young child can't do yet keeps the panel (and the reset button) safe.
  let gateSum = 0;
  let gatePass = null;
  function openGate(onPass) {
    gatePass = onPass;
    const a = 6 + Math.floor(Math.random() * 7);
    const b = 6 + Math.floor(Math.random() * 7);
    gateSum = a * b;
    $('gateQ').textContent = `${a} × ${b}`;
    $('gateA').value = '';
    $('gateA').classList.remove('bad');
    $('gate').classList.remove('hidden');
    setTimeout(() => $('gateA').focus(), 50);
  }
  $('btnParent').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (panelOpen()) return;
    pauseGame(null);
    openGate(() => {
      renderFamily();
      showOfflineInfo();
      $('parent').classList.remove('hidden');
    });
  });
  const gateTry = () => {
    if (parseInt($('gateA').value, 10) === gateSum) {
      $('gate').classList.add('hidden');
      const pass = gatePass;
      gatePass = null;
      if (pass) pass();
      return;
    }
    const inp = $('gateA');
    inp.classList.remove('bad');
    void inp.offsetWidth;
    inp.classList.add('bad');
    inp.value = '';
  };
  $('gateOk').addEventListener('click', gateTry);
  $('gateA').addEventListener('keydown', (e) => { if (e.key === 'Enter') gateTry(); });
  $('gateCancel').addEventListener('click', () => {
    $('gate').classList.add('hidden');
    gatePass = null;
    // From the break screen, cancelling goes back to the break screen.
    if (!$('rest').classList.contains('hidden')) return;
    resumeGame();
  });
  $('btnParentClose').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    $('parent').classList.add('hidden');
    resumeGame();
  });
  $('appVersion').textContent = `Sürüm ${APP_VERSION}`;
  $('shopClose').addEventListener('pointerdown', (e) => { e.preventDefault(); closeShop(); paintHud(); });
  $('btnAlbum').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!G.started || panelOpen()) return;
    unlockAudio();
    pauseGame(null);
    openAlbum();
  });
  $('albumClose').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    closeAlbum();
    paintHud();
    resumeGame();
  });
  bindAlbumUi();
  addEventListener('keydown', (e) => {
    // Typing (the gate answer, a child's name) is not a game key; holding a key doesn't repeat.
    if (e.repeat || (e.target && e.target.closest && e.target.closest('input, select, textarea'))) return;
    if ((e.code === 'KeyP' || e.code === 'Escape') && G.started && !panelOpen()) {
      if (G.paused) resumeGame();
      else pauseGame('pause');
    }
    if (e.code === 'KeyM') toggleMute();
  });
}

function toggleMute() {
  S.muted = !S.muted;
  if (S.muted) hush();
  writeSave(S);
  applyVolumes();
  $('btnMute').textContent = S.muted ? '🔇' : '🔊';
}

/** Fill the dive overlay with rising CSS bubbles once. */
function fillDiveBubbles() {
  const box = $('diveBubbles');
  if (!box || box.childElementCount) return;
  for (let i = 0; i < 18; i++) {
    const b = document.createElement('i');
    const size = 6 + Math.random() * 14;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    b.style.left = `${Math.random() * 100}%`;
    b.style.animationDuration = `${3.5 + Math.random() * 4.5}s`;
    b.style.animationDelay = `${Math.random() * 4}s`;
    box.appendChild(b);
  }
}
fillDiveBubbles();

const AIR = {
  fog: 0xdff3fb, fogNear: 70, fogFar: 230, bg: 0x9fd6f5,
  hemi: 0xfff4e0, ground: 0x7cc46a, hemiI: 0.95, sunI: 1.15, fov: 55, exposure: 1.1,
};
const SURFACE = {
  fog: 0x7be3ff, fogNear: 26, fogFar: 120, bg: 0x67d4f8,
  hemi: 0xd8f6ff, ground: 0x1b88b8, hemiI: 0.92, sunI: 1.0, fov: 58, exposure: 1.08,
};
const UNDER = {
  fog: 0x1ea8cc, fogNear: 6.5, fogFar: 38, bg: 0x1488ad,
  hemi: 0xd0f8ff, ground: 0x1b7a9a, hemiI: 1.35, sunI: 0.95, fov: 64, exposure: 1.15,
};

let waterLook = 'air';
const btnJumpEl = $('btnJump');
let swingPulseOn = false;
function applyWaterLook(mode) {
  if (waterLook === mode) return;
  waterLook = mode;
  const p = mode === 'under' ? UNDER : mode === 'surface' ? SURFACE : AIR;
  scene.fog.color.setHex(p.fog);
  scene.fog.near = p.fogNear;
  scene.fog.far = p.fogFar;
  scene.background.setHex(p.bg);
  hemi.color.setHex(p.hemi);
  hemi.groundColor.setHex(p.ground);
  hemi.intensity = p.hemiI;
  sun.intensity = p.sunI;
  camera.fov = p.fov;
  camera.updateProjectionMatrix();
  renderer.toneMappingExposure = p.exposure;
  if (world && world.sky) world.sky.visible = mode !== 'under';
  const dive = $('dive');
  dive.classList.toggle('hidden', mode === 'air');
  dive.classList.toggle('on', mode === 'under');
  dive.classList.toggle('surface', mode === 'surface');
  dive.setAttribute('aria-hidden', mode === 'air' ? 'true' : 'false');
}

let waterDt = 0.016;
function tickWaterLook() {
  if (!G.started) { applyWaterLook('air'); return; }
  const camUnder = camera.position.y < -0.02 || PL.submerged;
  if (camUnder) applyWaterLook('under');
  else if (PL.swimming) applyWaterLook('surface');
  else applyWaterLook('air');
  const btnDive = $('btnDive');
  if (btnDive) {
    const airMove = !PL.onG && !PL.swimming && !PL.climbing && !PL.onSlide;
    const fph = PL.flying ? PL.flying.phase : '';
    const rideBtn = !!PL.swinging || fph === 'fly' || fph === 'approach' || fph === 'glide';
    const flyingNoBtn = !!PL.flying && !rideBtn;
    btnDive.classList.toggle('hidden', flyingNoBtn || (!PL.swimming && !airMove && !rideBtn));
    const lbl = PL.swimming ? '🤿' : PL.swinging ? '🚀' : PL.flying ? (fph === 'fly' ? '🛬' : '↩') : '💥';
    if (btnDive.textContent !== lbl) btnDive.textContent = lbl;
    const jl = PL.flying ? '🌀' : '⬆';
    if (btnJumpEl.textContent !== jl) btnJumpEl.textContent = jl;
    const swingPulse = !!(PL.swinging && PL.swinging.maxAmp < 0.6);
    if (swingPulse !== swingPulseOn) {
      swingPulseOn = swingPulse;
      if (swingPulse) btnJumpEl.classList.add('pulse');
      else if (G.hint !== 'jump') btnJumpEl.classList.remove('pulse');
    }
  }
  if (world && world.waterBubbles) {
    world.waterBubbles.visible = PL.swimming;
    if (PL.swimming) {
      world.waterBubbles.position.set(PL.x, PL.y + 0.35, PL.z);
      world.waterBubbles.children.forEach((b, i) => {
        b.position.y += (0.8 + (i % 5) * 0.15) * waterDt;
        if (b.position.y > 2.2) {
          b.position.y = -0.3;
          b.position.x = (Math.random() - 0.5) * 1.6;
          b.position.z = (Math.random() - 0.5) * 1.6;
        }
      });
    }
  }
  if (world && world.waterRipples) {
    world.waterRipples.forEach((rp, i) => {
      if (!PL.swimming) {
        rp.material.opacity = 0;
        return;
      }
      const p = (G.time * 0.9 + i / 3) % 1;
      rp.position.set(PL.x, -0.02, PL.z);
      rp.scale.setScalar(0.8 + p * 2.4);
      rp.material.opacity = (1 - p) * (PL.submerged ? 0.25 : 0.65);
    });
  }
}

/*
 * Auto quality: if the first seconds of play run below ~40 fps, drop to a sharpness of 1 and a
 * smaller shadow map, once. A parent never has to find a setting for a slow tablet.
 */
const perf = { t: 0, frames: 0, done: false };
function watchSpeed(dt) {
  if (perf.done || G.paused) return;
  perf.t += dt;
  if (perf.t < 1.5) return; // skip start-up hitches
  perf.frames++;
  if (perf.t < 6) return;
  perf.done = true;
  const avg = (perf.t - 1.5) / perf.frames;
  if (avg > 0.025) {
    renderer.setPixelRatio(1);
    sun.shadow.mapSize.set(1024, 1024);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    resize();
    G.lowQuality = true;
  }
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last) / 1000; // real frame time, for the speed check
  const dt = Math.min(0.05, raw);
  last = now;
  if (!G.ready) return;
  if (!G.paused) G.time += dt;
  if (G.started && !G.paused) {
    watchSpeed(Math.min(raw, 0.25));
    moving = updatePlayer(world, dt);
    updateBear(bear, dt, PL, moving);
    tickToys(world, dt, G.time, bear);
    tickWorld(world, dt, G.time);
    tickBalloons(world.balloons, dt, G.time, PL);
    tickHide(world.hideBush, dt, G.time, PL);
    tickHunt(world.hunt, dt, G.time, PL);
    tickDaily();
    if (!document.hidden) addPlayTime(Math.min(raw, 0.25));
    checkLimit(Math.min(raw, 0.25));
    if (!G.lock && !PL.flying) interact();
    tickQuest();
    const t = guideTarget();
    G.camLook = t;
    updateGuide(guide, dt, G.time, PL, t, guideMarks(), G.camYaw);
    updateFollowers(dt);
  } else if (world) {
    tickWorld(world, dt, G.time);
    tickToys(world, dt, G.time, bear);
    if (bear) updateBear(bear, dt, PL, false);
    if (!G.paused) updateGuide(guide, dt, G.time, PL, null, [], G.camYaw);
  }
  waterDt = dt;
  tickWaterLook();
  tickMusic(speaking() || speakOpen(), PL.submerged, speakOpen());
  sun.position.set(PL.x + 16, 28, PL.z + 8);
  sun.target.position.set(PL.x, 0, PL.z);
  updateCamera(camera, dt, world && world.camBlock);
  if (window.__topCam) { // debug only (?debug)
    const t = window.__topCam;
    camera.position.set(t.x, t.y, t.z);
    camera.lookAt(t.lx, t.ly || 0, t.lz);
  }
  tickWaterLook();
  if (world) {
    world.sky.position.copy(camera.position);
    if (world.skyDecor) world.skyDecor.position.set(camera.position.x, 0, camera.position.z);
  }
  renderer.render(scene, camera);
}

/** Family panel line: is the game stored for offline play yet? */
async function showOfflineInfo() {
  const el = $('offlineInfo');
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller || !window.caches) {
    el.textContent = 'Çevrimdışı kopya: yok (yalnızca internetle ya da oyna.bat ile açılır).';
    return;
  }
  let voices = 0;
  // Only this game's caches (a shared *.github.io address can hold other sites' caches too).
  for (const key of (await caches.keys()).filter((k) => k.startsWith('superayi-'))) {
    const reqs = await (await caches.open(key)).keys();
    voices += reqs.filter((r) => r.url.includes('/assets/voice/') && !r.url.includes('/custom/')).length;
  }
  const total = Object.keys(LINES).length * 2;
  el.textContent = voices >= total
    ? 'Çevrimdışı kopya: hazır. İnternet olmadan da açılır.'
    : `Çevrimdışı kopya: iniyor (${voices}/${total} ses). Oyunu internete bağlıyken biraz açık bırakın.`;
}

bindUi();
$('btnMute').textContent = S.muted ? '🔇' : '🔊';
requestAnimationFrame(frame);
boot().catch((err) => {
  console.error(err);
  $('load').classList.remove('hidden');
  $('loadText').textContent = 'Bir şey takıldı. oyna.bat ile aç.';
});
