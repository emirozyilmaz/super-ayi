/*
 * Free places on the ground, picked at run time. The garden is full of houses, trees, water and
 * toys, so new things (balloons, hiding bushes) are placed by sampling around a point and keeping
 * only spots inside the play area, out of the water and clear of every obstacle and platform.
 */

function nearSegment(x, z, r) {
  const dx = r.x1 - r.x0;
  const dz = r.z1 - r.z0;
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - r.x0) * dx + (z - r.z0) * dz) / len2));
  return Math.hypot(x - (r.x0 + dx * t), z - (r.z0 + dz * t));
}

/** True when a circle of radius `clear` at (x, z) touches nothing. */
export function isFree(world, x, z, clear) {
  const b = world.bounds;
  const ex = (x - b.cx) / b.a;
  const ez = (z - b.cz) / b.b;
  if (ex * ex + ez * ez > 0.8) return false;
  for (const w of world.waters) {
    if (w.kind === 'pond' ? Math.hypot(x - w.x, z - w.z) < w.r + clear
      : Math.abs(x - w.x) <= w.hw + clear && Math.abs(z - w.z) <= w.hd + clear) return false;
  }
  for (const o of world.obstacles) {
    if (o.box) {
      if (Math.abs(x - o.x) < o.hw + clear && Math.abs(z - o.z) < o.hd + clear) return false;
    } else if (Math.hypot(x - o.x, z - o.z) < o.r + clear) return false;
  }
  // Keep the garden gate and the big landmarks (houses, arches, trees) clear as well.
  if (world.gate && Math.hypot(x - world.gate.x, z - world.gate.z) < world.gate.r + 1 + clear) return false;
  for (const o of world.camBlock || []) {
    if (Math.hypot(x - o.position.x, z - o.position.z) < 2.5 + clear) return false;
  }
  for (const p of world.platforms) {
    if (p.ramp) {
      if (nearSegment(x, z, p.ramp) < p.ramp.w + clear) return false;
    } else if (Math.abs(x - p.x) < p.hw + clear && Math.abs(z - p.z) < p.hd + clear) return false;
  }
  return true;
}

/**
 * A free spot between minD and maxD from `from`, at least `apart` from every spot in `avoid`.
 * Returns null when none is found.
 */
export function freeSpot(world, from, minD, maxD, clear, avoid = [], apart = 0) {
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = minD + Math.random() * (maxD - minD);
    const x = from.x + Math.cos(a) * d;
    const z = from.z + Math.sin(a) * d;
    if (!isFree(world, x, z, clear)) continue;
    if (avoid.some((s) => Math.hypot(s.x - x, s.z - z) < apart)) continue;
    return { x, z };
  }
  return null;
}
