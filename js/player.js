import * as THREE from 'three';
import { IN, PL, G } from './state.js';
import { sfx, say } from './audio.js';
import { tryMountSwing, tryBoardPlane, updateSwing, updateFlight } from './toys.js';

function waterAt(world, x, z) {
  if (!world.waters) return null;
  for (const w of world.waters) {
    if (w.kind === 'pond') {
      if (Math.hypot(x - w.x, z - w.z) < w.r) return w;
    } else if (Math.abs(x - w.x) <= w.hw && Math.abs(z - w.z) <= w.hd) {
      return w;
    }
  }
  return null;
}

const KEY = { l: 0, r: 0, u: 0, d: 0 };

/** Forget held keys (window lost focus, game paused): nothing walks on by itself afterwards. */
export function releaseKeys() {
  KEY.l = 0; KEY.r = 0; KEY.u = 0; KEY.d = 0;
}

export function bindKeys() {
  addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') KEY.l = 1;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') KEY.r = 1;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') KEY.u = 1;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') KEY.d = 1;
    if (e.code === 'Space' && !e.repeat) { IN.jumpBuf = 0.14; IN.jumpHeld = true; }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC' || e.code === 'KeyF') {
      if (!e.repeat) IN.diveBuf = 0.18;
      IN.diveHeld = true;
    }
    if (e.code === 'KeyQ') IN.camDrag = 1;
    if (e.code === 'KeyE') IN.camDrag = -1;
  });
  addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') KEY.l = 0;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') KEY.r = 0;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') KEY.u = 0;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') KEY.d = 0;
    if (e.code === 'Space') IN.jumpHeld = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC' || e.code === 'KeyF') {
      IN.diveHeld = false;
    }
    if (e.code === 'KeyQ' || e.code === 'KeyE') IN.camDrag = 0;
  });
}

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function updatePlayer(world, dt) {
  const locked = G.lock || G.paused || !G.started;
  let ix = IN.x + (KEY.r - KEY.l);
  let iy = -IN.y + (KEY.u - KEY.d);
  if (locked) { ix = 0; iy = 0; }
  const mag = Math.hypot(ix, iy);
  if (mag > 1) { ix /= mag; iy /= mag; }

  if (IN.camDrag) G.camYaw += IN.camDrag * dt * 1.6;
  if (mag > 0.12 || IN.camDrag || IN.jumpBuf > 0) G.lastInput = G.time;
  const look = G.camLook;
  if (look && !locked && !PL.climbing && !PL.flying && !PL.swinging && mag < 0.12 && Math.hypot(look.x - PL.x, look.z - PL.z) > 2) {
    const forced = G.time < G.camLookUntil;
    if (forced || G.time - G.lastInput > 6) {
      const want = Math.atan2(-(look.x - PL.x), -(look.z - PL.z));
      G.camYaw = lerpAngle(G.camYaw, want, Math.min(1, dt * (forced ? 2.8 : 0.9)));
    }
  }

  const fx = -Math.sin(G.camYaw);
  const fz = -Math.cos(G.camYaw);
  const rx = -fz;
  const rz = fx;
  const moving = mag > 0.12 && !locked;

  // Riding the swing or flying the plane: those modes drive the bear completely.
  if (PL.swinging || PL.flying) {
    const inp = {
      locked, ix, iy, wmag: mag, wz: fz * iy + rz * ix,
      jump: IN.jumpBuf > 0, dive: IN.diveBuf > 0,
    };
    IN.jumpBuf = 0;
    IN.diveBuf = 0;
    if (PL.swinging) updateSwing(world, dt, inp);
    else updateFlight(world, dt, inp);
    return false;
  }

  const vine = world.vine;
  const nearVine = Math.hypot(PL.x - vine.x, PL.z - vine.z) < 0.95;
  if (!PL.climbing && nearVine && iy > 0.55 && !locked && PL.y < vine.top - 0.2) {
    PL.climbing = vine;
    PL.vy = 0;
    PL.vx = 0; PL.vz = 0;
    PL.diving = false; PL.stomping = false; PL.sliding = 0; PL.launched = false;
  }

  if (PL.climbing && locked) {
    // Frozen on the vine while a dialog or card is open.
    PL.vy = 0;
    return false;
  }
  if (PL.climbing && PL.y <= 0.05 && (iy < -0.3 || Math.abs(ix) > 0.6)) {
    // At the foot of the vine, pulling back or sideways simply steps off it.
    PL.climbing = null;
    PL.onG = true;
  }
  if (PL.climbing) {
    PL.x += (vine.x - 0.42 - PL.x) * Math.min(1, dt * 8);
    PL.z += (vine.z - PL.z) * Math.min(1, dt * 8);
    PL.y += iy * 2.6 * dt;
    const prevPhase = PL.climbPhase || 0;
    PL.climbPhase = prevPhase + iy * dt * 7;
    if (Math.floor(PL.climbPhase / Math.PI) !== Math.floor(prevPhase / Math.PI)) sfx.click();
    G.camYaw = lerpAngle(G.camYaw, -Math.PI / 2 - 0.85, Math.min(1, dt * 2.5));
    if (PL.y < 0) PL.y = 0;
    if (PL.y > vine.top) PL.y = vine.top;
    PL.onG = false;
    PL.swimming = false;
    PL.submerged = false;
    if (IN.jumpBuf > 0) {
      PL.climbing = null;
      PL.vy = 7;
      IN.jumpBuf = 0;
      sfx.jump();
    } else if (PL.y > vine.top - 0.15 && iy > 0.25) {
      PL.climbing = null;
      PL.x = 38.05;
      PL.z = 12;
      PL.y = 3.05;
      PL.vy = 0;
      PL.onG = true;
    }
    PL.yaw = lerpAngle(PL.yaw, Math.PI / 2, Math.min(1, dt * 8));
    return moving;
  }

  // Probe water / bridge before applying horizontal speed (SBA: stick strength + dive speed).
  const wetNow = waterAt(world, PL.x, PL.z);
  let onPad = false;
  for (const p of world.platforms) {
    const step = p.y < 1.2 ? 0.4 : 0.08;
    if (Math.abs(PL.x - p.x) <= p.hw + PL.r * 0.35 && Math.abs(PL.z - p.z) <= p.hd + PL.r * 0.35 && PL.y >= p.y - step) {
      onPad = true;
    }
  }
  const willSwim = !!(wetNow && !onPad && PL.y <= (wetNow.surface + 0.55));
  let swimMul = 1;
  if (willSwim) {
    // Soft pull = slow swim, full stick = fast; underwater a bit quicker (SBA dive boost).
    swimMul = (0.34 + Math.min(1, mag) * 0.62) * (PL.submerged ? 1.22 : 0.88);
  }
  // Wanted velocity from the stick; the real velocity eases toward it so starts/stops feel weighty.
  const tx = (fx * iy + rx * ix) * PL.speed * swimMul;
  const tz = (fz * iy + rz * ix) * PL.speed * swimMul;
  let vx;
  let vz;
  if (PL.onSlide) {
    vx = 0; vz = 0; PL.vx = 0; PL.vz = 0;
  } else if (PL.diving || PL.sliding > 0) {
    const boost = PL.diving ? 7.4 : 6.0;
    vx = Math.sin(PL.yaw) * boost;
    vz = Math.cos(PL.yaw) * boost;
    PL.vx = vx;
    PL.vz = vz;
  } else {
    const rate = willSwim ? 3.4 : (PL.wasG ? (moving ? 8 : 11) : (PL.carry ? 0.8 : 3.6));
    const k = 1 - Math.exp(-rate * dt);
    const gx = PL.stomping ? tx * 0.2 : tx;
    const gz = PL.stomping ? tz * 0.2 : tz;
    PL.vx += (gx - PL.vx) * k;
    PL.vz += (gz - PL.vz) * k;
    vx = PL.vx;
    vz = PL.vz;
  }

  PL.x += vx * dt;
  PL.z += vz * dt;
  if (moving) {
    const ty = Math.atan2(tx, tz);
    PL.yaw = lerpAngle(PL.yaw, ty, Math.min(1, dt * 8));
  }

  const bd = world.bounds;
  const ex = (PL.x - bd.cx) / bd.a;
  const ez = (PL.z - bd.cz) / bd.b;
  const e = ex * ex + ez * ez;
  if (e > 0.93) {
    const k = Math.sqrt(0.93 / e);
    PL.x = bd.cx + ex * k * bd.a;
    PL.z = bd.cz + ez * k * bd.b;
  }

  for (const o of world.obstacles) {
    if (o.off || (o.aboveWater && PL.y < -0.2)) continue;
    if (o.box) {
      const nx = Math.max(o.x - o.hw, Math.min(PL.x, o.x + o.hw));
      const nz = Math.max(o.z - o.hd, Math.min(PL.z, o.z + o.hd));
      const dx = PL.x - nx;
      const dz = PL.z - nz;
      const dd = Math.hypot(dx, dz);
      if (dd < PL.r && dd > 1e-5) {
        PL.x = nx + (dx / dd) * PL.r;
        PL.z = nz + (dz / dd) * PL.r;
      } else if (dd <= 1e-5) {
        const left = (PL.x - (o.x - o.hw)) + PL.r;
        const right = ((o.x + o.hw) - PL.x) + PL.r;
        const back = (PL.z - (o.z - o.hd)) + PL.r;
        const fwd = ((o.z + o.hd) - PL.z) + PL.r;
        const m = Math.min(left, right, back, fwd);
        if (m === left) PL.x = o.x - o.hw - PL.r;
        else if (m === right) PL.x = o.x + o.hw + PL.r;
        else if (m === back) PL.z = o.z - o.hd - PL.r;
        else PL.z = o.z + o.hd + PL.r;
      }
      continue;
    }
    const dx = PL.x - o.x;
    const dz = PL.z - o.z;
    const dd = Math.hypot(dx, dz);
    const rr = o.r + PL.r;
    if (dd < rr && dd > 0.0001) {
      PL.x = o.x + (dx / dd) * rr;
      PL.z = o.z + (dz / dd) * rr;
    }
  }

  const prevY = PL.y;
  const wet = waterAt(world, PL.x, PL.z);
  let gy = !wet && world.groundHeightAt ? Math.min(0, world.groundHeightAt(PL.x, PL.z)) : 0;
  let onPlatform = false;
  let onRamp = false;
  for (const p of world.platforms) {
    if (p.ramp) {
      // Walk-up ramp in any horizontal direction: the bear simply strolls up it, no jumping needed.
      const r = p.ramp;
      const rdx = r.x1 - r.x0;
      const rdz = r.z1 - r.z0;
      const rlen = Math.hypot(rdx, rdz);
      const ux = rdx / rlen;
      const uz = rdz / rlen;
      const qx = PL.x - r.x0;
      const qz = PL.z - r.z0;
      const along = qx * ux + qz * uz;
      const side = Math.abs(-qx * uz + qz * ux);
      if (side <= r.w && along >= -0.25 && along <= rlen) {
        const t = Math.max(0, Math.min(1, along / rlen));
        const ry = r.y0 + (r.y1 - r.y0) * t;
        if (prevY >= ry - 0.6) { gy = Math.max(gy, ry); onPlatform = true; onRamp = true; }
      }
      continue;
    }
    const step = p.y < 1.2 ? 0.4 : 0.08;
    if (Math.abs(PL.x - p.x) <= p.hw + PL.r * 0.35 && Math.abs(PL.z - p.z) <= p.hd + PL.r * 0.35 && prevY >= p.y - step) {
      gy = Math.max(gy, p.y);
      onPlatform = true;
    }
  }

  IN.jumpBuf = Math.max(0, IN.jumpBuf - dt);
  IN.diveBuf = Math.max(0, IN.diveBuf - dt);
  PL.onG = false;

  // Swim physics only while inside the water volume (not the infinite air column above it).
  const surface = wet ? wet.surface : -0.04;
  const inWaterVol = !!(wet && !onPlatform && PL.y <= surface + 0.45);

  if (inWaterVol) {
    // Land moves don't carry on in the water (no 7 m/s torpedo, no 20 % crawl after a stomp).
    PL.diving = false; PL.stomping = false; PL.sliding = 0; PL.launched = false;
    // Super Bear Adventure water:
    //  • Joystick / WASD / Arrows swim in 4 directions on the horizontal plane.
    //  • B button (🤿 Dive / Shift / C / F) dives underwater from the surface or swims deeper.
    //  • A button (⬆ / Space) leaps out when at the surface, or swims upward when underwater!
    //  • Bubble geyser in the lagoon center lifts a submerged bear back up.
    const floor = world.groundHeightAt
      ? Math.max(wet.floor, world.groundHeightAt(PL.x, PL.z))
      : wet.floor;
    const floatY = surface - 0.54;
    PL.swimming = true;
    PL.swimPhase = (PL.swimPhase || 0) + dt * (moving ? 10.5 : 4.5);

    if (IN.diveBuf > 0 && !locked) {
      // Tap 🤿 at the surface → plunge straight into underwater mode!
      IN.diveBuf = 0;
      PL.submerged = true;
      PL.vy = Math.min(PL.vy - 3.6, -4.2);
      if (PL.y > surface - 0.72) PL.y = surface - 0.78;
      sfx.splash();
    }

    if (IN.diveHeld) {
      PL.submerged = true;
      PL.vy -= 15 * dt;
    } else if (PL.submerged) {
      if (IN.jumpHeld) {
        PL.vy += 18 * dt;
      } else {
        // Gentle SBA underwater sink toward the reef floor.
        PL.vy -= 2.2 * dt;
        PL.vy *= Math.pow(0.28, dt);
      }
      // Bubble geyser only lifts while submerged so it never launches you into the sky!
      if (world.geyser && PL.y < surface - 0.55 && Math.hypot(PL.x - world.geyser.x, PL.z - world.geyser.z) < world.geyser.r) {
        PL.vy = Math.min(3.8, PL.vy + 16 * dt);
      }
    } else {
      // Surface swimming: keep torso submerged right at floatY.
      const diff = floatY - PL.y;
      PL.vy += diff * 18 * dt;
      PL.vy *= Math.pow(0.04, dt);
    }

    if (PL.vy > 4.8) PL.vy = 4.8;
    if (PL.vy < -6.5) PL.vy = -6.5;
    PL.y += PL.vy * dt;

    if (PL.y < floor) {
      PL.y = floor;
      if (PL.vy < 0) PL.vy = 0;
      PL.onG = true;
      PL.jumps = 0;
    }

    // Surfacing from underwater when swimming up reaches the waterline.
    if (PL.submerged && !IN.diveHeld && PL.y >= surface - 0.56 && PL.vy >= 0) {
      PL.submerged = false;
      PL.y = floatY;
      PL.vy = 0;
      sfx.splash();
    }

    if (IN.jumpBuf > 0 && !locked) {
      if (!PL.submerged) {
        // Surface leap out of water (SBA A-button at surface).
        PL.vy = 7.2;
        PL.y = surface + 0.52;
        PL.swimming = false;
        PL.submerged = false;
        PL.jumps = 1;
        IN.jumpBuf = 0;
        PL.squash = 0.55;
        sfx.jump();
        sfx.splash();
      } else {
        // Underwater kick upward (SBA A-button while submerged).
        PL.vy = Math.max(PL.vy + 3.4, 4.2);
        IN.jumpBuf = 0;
        sfx.click();
      }
    }
  } else {
    PL.swimming = false;
    PL.submerged = false;
    if (PL.sliding > 0) PL.sliding = Math.max(0, PL.sliding - dt);

    // Rainbow Playground Slide: walk up the ramp, step onto the chute, and whee, you glide down!
    const sl = world.slide;
    if (sl && !PL.onSlide && !locked && PL.wasG && Math.abs(PL.z - sl.z) < sl.hw && PL.x >= sl.xTop - 0.55 && PL.x <= sl.xTop + 1.2 && PL.y >= sl.yTop - 0.3) {
      PL.onSlide = true;
      PL.diving = false;
      PL.stomping = false;
      PL.slideV = 2.0;
      PL.yaw = Math.PI / 2;
      say('wheee', { soft: true });
      sfx.star();
      G.onEvent('slide');
    }
    if (PL.onSlide && sl) {
      // Gravity-like speed-up: starts gentle, ends brisk.
      PL.slideV = Math.min(7.2, PL.slideV + 5.2 * dt);
      PL.x += PL.slideV * dt;
      PL.z += (sl.z - PL.z) * Math.min(1, dt * 10);
      const t = Math.max(0, Math.min(1, (PL.x - sl.xTop) / (sl.xEnd - sl.xTop)));
      PL.y = sl.yTop + (sl.yEnd - sl.yTop) * t + 0.08;
      PL.vy = 0;
      PL.onG = true;
      PL.sliding = 0.2;
      PL.yaw = Math.PI / 2;
      if (t >= 1 || IN.jumpBuf > 0) {
        const jumpOff = IN.jumpBuf > 0;
        PL.onSlide = false;
        PL.vx = PL.slideV * 0.8;
        PL.vz = 0;
        PL.vy = jumpOff ? 6.6 : 2.4;
        PL.onG = false;
        PL.jumps = 1;
        IN.jumpBuf = 0;
        sfx.jump();
      }
      return true;
    }

    // Super Bear air moves: press B (💥 / Shift / C / F) in midair → Dive (if moving) or Belly Stomp!
    if (!PL.onG && !PL.diving && !PL.stomping && IN.diveBuf > 0 && !locked) {
      IN.diveBuf = 0;
      if (mag > 0.18) {
        PL.diving = true;
        PL.vy = Math.max(PL.vy, 3.2);
        sfx.jump();
      } else {
        PL.stomping = true;
        PL.vy = -15;
        sfx.pop();
      }
    }

    PL.vy -= (PL.stomping ? 32 : 19) * dt;
    if (PL.vy < -24) PL.vy = -24;
    // Ground-stick on ramps so walking downhill never turns into tiny hops.
    if (onRamp && PL.wasG && PL.vy <= 0 && PL.y > gy && PL.y - gy < 0.3) PL.y = gy;
    PL.y += PL.vy * dt;
    if (PL.vy <= 0 && PL.y <= gy) {
      PL.y = gy;
      const wasStomp = PL.stomping;
      const wasDive = PL.diving;
      PL.diving = false;
      PL.stomping = false;
      PL.launched = false;
      if (wasStomp) {
        // Stomp Boost bounce!
        PL.vy = 5.8;
        PL.launched = true;
        PL.onG = false;
        PL.jumps = 1;
        PL.squash = 1.35;
        sfx.pop();
      } else {
        PL.vy = 0;
        PL.onG = true;
        PL.jumps = 0;
        if (wasDive) PL.sliding = 0.32;
        if (!PL.wasG) PL.squash = 1;
      }
    }

    // Bouncy Trampoline Mushrooms!
    if (world.trampolines) {
      for (const tr of world.trampolines) {
        if (Math.hypot(PL.x - tr.x, PL.z - tr.z) < tr.r && PL.y <= 0.85 && PL.vy <= 1) {
          PL.vy = 11.2;
          PL.launched = true;
          PL.y = 0.65;
          PL.onG = false;
          PL.diving = false;
          PL.stomping = false;
          PL.jumps = 1;
          PL.squash = 0.85;
          tr.bounce = 1;
          sfx.jump();
          if (G.time > tr.cool) {
            tr.cool = G.time + 3.5;
            say('boing', { soft: true });
          }
        }
      }
    }

    if (PL.onG) PL.coyote = 0.12;
    else PL.coyote = Math.max(0, PL.coyote - dt);
    if (IN.jumpBuf > 0 && !locked) {
      if (PL.coyote > 0 || PL.sliding > 0) {
        PL.vy = PL.sliding > 0 ? 7.6 : 7.0;
        PL.sliding = 0;
        PL.diving = false;
        PL.jumps = 1; PL.coyote = 0; IN.jumpBuf = 0; PL.squash = 0.65; sfx.jump();
      } else if (PL.jumps < 2) {
        PL.vy = 6.2; PL.jumps = 2; PL.diving = false; IN.jumpBuf = 0; sfx.jump();
      }
    }
    // Letting go of jump early makes a short hop (not for bounces and launches).
    if (!IN.jumpHeld && PL.vy > 2.8 && !PL.diving && !PL.launched) PL.vy = 2.8;
    if (PL.vy <= 0) PL.launched = false;
  }

  if (PL.swimming && !PL.wasSwim) {
    sfx.splash();
    if (G.time > G.splashCool) {
      G.splashCool = G.time + 5;
      say('splash', { soft: true });
    }
  }
  // Soft sky ceiling — no more infinite space-rocket from the pond.
  if (PL.y > 14) PL.vy = Math.min(PL.vy, 2);
  if (PL.y > 22) { PL.y = 22; PL.vy = Math.min(PL.vy, -1); }

  if (PL.onG || PL.swimming) PL.carry = false;
  if (tryMountSwing(world, locked) || tryBoardPlane(world, locked)) {
    PL.wasSwim = false;
    return false;
  }

  PL.wasSwim = PL.swimming;
  PL.wasG = PL.onG;
  if (PL.y < -8) { PL.x = -2; PL.z = 2; PL.y = 0; PL.vy = 0; PL.swimming = false; PL.submerged = false; }
  PL.squash *= Math.pow(0.08, dt);
  return moving;
}

const ray = new THREE.Raycaster();
const head = new THREE.Vector3();
const want = new THREE.Vector3();
const dir = new THREE.Vector3();

/** Follow camera that slides in front of trees, houses and arches — and dives underwater with the bear. */
export function updateCamera(camera, dt, blockers) {
  if (!G.started) {
    const a = G.time * 0.15;
    camera.position.set(Math.sin(a) * 16, 7, Math.cos(a) * 16);
    camera.lookAt(0, 1.2, 0);
    return;
  }
  const under = PL.submerged;
  const fly = !!PL.flying;
  const swg = !!PL.swinging;
  const dist = fly ? 9.8 : swg ? 9.5 : (under ? 4.6 : (PL.swimming ? 6.8 : 8.4));
  const height = fly ? 3.2 : swg ? 1.8 : (under ? 0.55 : (PL.swimming ? 2.6 : 4.3));
  head.set(PL.x, PL.y + (fly ? 0.7 : swg ? 0.4 : (under ? 0.65 : 1.15)), PL.z);
  want.set(PL.x + Math.sin(G.camYaw) * dist, PL.y + height, PL.z + Math.cos(G.camYaw) * dist);
  if (under && want.y > -0.18) want.y = -0.18; // keep camera below water surface when diving!
  dir.subVectors(want, head);
  const full = dir.length();
  dir.normalize();
  let k = 1 - Math.pow(0.0008, dt);
  if (!under && blockers && blockers.length) {
    ray.set(head, dir);
    ray.far = full;
    const hit = ray.intersectObjects(blockers, true)[0];
    if (hit) {
      const d = Math.max(2.2, hit.distance - 0.4);
      want.copy(head).addScaledVector(dir, d);
      k = 1 - Math.pow(0.00002, dt);
    }
  }
  camera.position.lerp(want, k);
  const minY = under ? (PL.y + 0.25) : (PL.swimming ? 0.45 : 1.2);
  if (camera.position.y < minY) camera.position.y = minY;
  camera.lookAt(PL.x, PL.y + (fly ? 0.6 : swg ? 0.4 : (under ? 0.65 : 1.1)), PL.z);
}
