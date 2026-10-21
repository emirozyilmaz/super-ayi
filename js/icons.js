import { COLORS } from './lines.js';

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
const svg = (body) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export function flowerSvg(color) {
  const c = hex(color);
  let petals = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    petals += `<circle cx="${(50 + Math.cos(a) * 20).toFixed(1)}" cy="${(40 + Math.sin(a) * 20).toFixed(1)}" r="15" fill="${c}"/>`;
  }
  return svg(
    '<path d="M50 56 Q47 78 50 96" stroke="#2e7d32" stroke-width="7" fill="none" stroke-linecap="round"/>'
    + '<ellipse cx="63" cy="80" rx="13" ry="6" fill="#43a047" transform="rotate(-25 63 80)"/>'
    + `${petals}<circle cx="50" cy="40" r="11" fill="#fff59d"/>`,
  );
}

export function blobSvg(color) {
  return svg(
    `<path d="M50 10 C70 10 74 26 86 30 C98 36 92 56 86 64 C80 74 86 90 66 90 C54 90 50 82 38 86 C22 92 10 80 14 64 C16 54 6 46 12 34 C18 22 34 10 50 10Z" fill="${hex(color)}"/>`
    + '<ellipse cx="36" cy="32" rx="11" ry="6" fill="#fff" opacity=".4"/>',
  );
}

export const appleSvg = () => svg(
  '<path d="M50 30 C30 18 10 32 14 56 C18 82 36 94 50 86 C64 94 82 82 86 56 C90 32 70 18 50 30Z" fill="#e53935"/>'
  + '<path d="M50 30 Q52 16 58 10" stroke="#6d4c41" stroke-width="5" fill="none" stroke-linecap="round"/>'
  + '<ellipse cx="67" cy="18" rx="11" ry="6" fill="#43a047" transform="rotate(-20 67 18)"/>'
  + '<ellipse cx="33" cy="46" rx="7" ry="11" fill="#fff" opacity=".35"/>',
);

export const bananaSvg = () => svg(
  '<path d="M20 26 C22 68 52 90 88 74 C90 70 88 65 83 65 C56 72 38 56 32 26 C30 18 20 18 20 26Z" fill="#ffe14a" stroke="#c9a400" stroke-width="3" stroke-linejoin="round"/>'
  + '<path d="M22 26 L19 14" stroke="#6d4c41" stroke-width="6" stroke-linecap="round"/>'
  + '<path d="M34 40 C40 58 56 66 74 66" stroke="#fff6a8" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>',
);

export const starSvg = () => svg(
  '<path d="M50 6 L62 36 L94 38 L69 58 L78 92 L50 73 L22 92 L31 58 L6 38 L38 36Z" fill="#ffc107" stroke="#f57f17" stroke-width="3" stroke-linejoin="round"/>'
  + '<circle cx="40" cy="44" r="4" fill="#5d4037"/><circle cx="60" cy="44" r="4" fill="#5d4037"/>'
  + '<path d="M42 56 Q50 63 58 56" stroke="#5d4037" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
);

export const jumpSvg = () => svg(
  '<path d="M50 6 L86 46 H64 V78 H36 V46 H14Z" fill="#4fc3f7" stroke="#0288d1" stroke-width="4" stroke-linejoin="round"/>'
  + '<ellipse cx="50" cy="92" rx="24" ry="5" fill="#000" opacity=".15"/>',
);

export const archSvg = () => {
  const cols = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
  let arcs = '';
  cols.forEach((c, i) => {
    const r = 44 - i * 6.5;
    arcs += `<path d="M${50 - r} 82 A${r} ${r} 0 0 1 ${50 + r} 82" stroke="${c}" stroke-width="6.5" fill="none"/>`;
  });
  return svg(`${arcs}<ellipse cx="50" cy="86" rx="46" ry="6" fill="#7cb86a"/>`);
};

export const bubbleSvg = () => svg(
  '<circle cx="50" cy="50" r="44" fill="#e1bee7" opacity=".7" stroke="#ab47bc" stroke-width="3"/>'
  + '<circle cx="34" cy="38" r="8" fill="#c68642"/><circle cx="66" cy="38" r="8" fill="#c68642"/>'
  + '<circle cx="50" cy="56" r="20" fill="#c68642"/><ellipse cx="50" cy="63" rx="9" ry="7" fill="#ffe0c2"/>'
  + '<circle cx="43" cy="52" r="3" fill="#24160f"/><circle cx="57" cy="52" r="3" fill="#24160f"/>'
  + '<ellipse cx="30" cy="26" rx="9" ry="5" fill="#fff" opacity=".8" transform="rotate(-35 30 26)"/>',
);

export const heartSvg = () => svg(
  '<path d="M50 88 C20 66 8 50 8 34 C8 20 20 10 32 10 C40 10 46 14 50 22 C54 14 60 10 68 10 C80 10 92 20 92 34 C92 50 80 66 50 88Z" fill="#ec407a" stroke="#ad1457" stroke-width="3"/>'
  + '<ellipse cx="30" cy="30" rx="8" ry="5" fill="#fff" opacity=".5" transform="rotate(-30 30 30)"/>',
);

export const earSvg = () => svg(
  '<path d="M14 38 H32 L54 18 V82 L32 62 H14Z" fill="#ef6c3a" stroke-linejoin="round"/>'
  + '<path d="M66 34 Q76 50 66 66" stroke="#ef6c3a" stroke-width="7" fill="none" stroke-linecap="round"/>'
  + '<path d="M76 24 Q92 50 76 76" stroke="#ef6c3a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>',
);

export const catSvg = () => svg(
  '<path d="M22 46 L18 14 L42 30 Q50 26 58 30 L82 14 L78 46 Z" fill="#ffb74d" stroke="#e65100" stroke-width="3" stroke-linejoin="round"/>'
  + '<circle cx="50" cy="56" r="30" fill="#ffb74d" stroke="#e65100" stroke-width="3"/>'
  + '<circle cx="38" cy="52" r="5" fill="#24160f"/><circle cx="62" cy="52" r="5" fill="#24160f"/>'
  + '<polygon points="50,58 45,64 55,64" fill="#ec407a"/>'
  + '<path d="M40 68 Q50 75 60 68" stroke="#5d4037" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
  + '<path d="M14 56 L30 58 M14 64 L30 63 M86 56 L70 58 M86 64 L70 63" stroke="#5d4037" stroke-width="3" stroke-linecap="round"/>',
);

export const duckSvg = () => svg(
  '<ellipse cx="50" cy="66" rx="32" ry="20" fill="#fff59d" stroke="#f9a825" stroke-width="3"/>'
  + '<circle cx="60" cy="38" r="18" fill="#fff59d" stroke="#f9a825" stroke-width="3"/>'
  + '<ellipse cx="78" cy="40" rx="11" ry="6" fill="#ff8f00"/>'
  + '<circle cx="64" cy="34" r="4" fill="#24160f"/>'
  + '<path d="M32 62 Q48 54 56 68" stroke="#fbc02d" stroke-width="5" fill="none" stroke-linecap="round"/>',
);

export const frogSvg = () => svg(
  '<ellipse cx="50" cy="60" rx="34" ry="24" fill="#66bb6a" stroke="#2e7d32" stroke-width="3"/>'
  + '<circle cx="32" cy="34" r="12" fill="#66bb6a" stroke="#2e7d32" stroke-width="3"/>'
  + '<circle cx="68" cy="34" r="12" fill="#66bb6a" stroke="#2e7d32" stroke-width="3"/>'
  + '<circle cx="32" cy="34" r="6" fill="#fff"/><circle cx="68" cy="34" r="6" fill="#fff"/>'
  + '<circle cx="32" cy="34" r="3.5" fill="#1b5e20"/><circle cx="68" cy="34" r="3.5" fill="#1b5e20"/>'
  + '<circle cx="28" cy="60" r="6" fill="#ff8fa3" opacity=".8"/><circle cx="72" cy="60" r="6" fill="#ff8fa3" opacity=".8"/>'
  + '<path d="M32 64 Q50 78 68 64" stroke="#1b5e20" stroke-width="4" fill="none" stroke-linecap="round"/>',
);

export const rabbitSvg = () => svg(
  '<ellipse cx="38" cy="24" rx="8" ry="20" fill="#f5f5f5" stroke="#9e9e9e" stroke-width="3"/>'
  + '<ellipse cx="62" cy="24" rx="8" ry="20" fill="#f5f5f5" stroke="#9e9e9e" stroke-width="3"/>'
  + '<ellipse cx="38" cy="26" rx="4" ry="13" fill="#f8bbd0"/><ellipse cx="62" cy="26" rx="4" ry="13" fill="#f8bbd0"/>'
  + '<circle cx="50" cy="60" r="26" fill="#f5f5f5" stroke="#9e9e9e" stroke-width="3"/>'
  + '<circle cx="40" cy="56" r="4.5" fill="#24160f"/><circle cx="60" cy="56" r="4.5" fill="#24160f"/>'
  + '<circle cx="50" cy="63" r="4" fill="#ec407a"/>'
  + '<path d="M42 70 Q50 76 58 70" stroke="#5d4037" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
);

export const birdSvg = () => svg(
  '<circle cx="50" cy="54" r="26" fill="#4fc3f7" stroke="#0288d1" stroke-width="3"/>'
  + '<polygon points="74,50 92,55 74,62" fill="#ffb300"/>'
  + '<circle cx="58" cy="46" r="4.5" fill="#24160f"/>'
  + '<path d="M32 54 Q46 42 52 60" fill="#039be5"/>',
);

export const slideSvg = () => svg(
  '<path d="M20 14 V88" stroke="#ffca28" stroke-width="8" stroke-linecap="round"/>'
  + '<rect x="10" y="12" width="26" height="8" rx="3" fill="#ff7043"/>'
  + '<path d="M30 22 Q58 30 86 82" stroke="#e53935" stroke-width="10" fill="none" stroke-linecap="round"/>'
  + '<path d="M30 22 Q60 34 86 82" stroke="#fdd835" stroke-width="4" fill="none" stroke-linecap="round" transform="translate(0 6)"/>'
  + '<path d="M30 22 Q62 38 86 82" stroke="#43a047" stroke-width="4" fill="none" stroke-linecap="round" transform="translate(0 12)"/>'
  + '<circle cx="42" cy="26" r="9" fill="#c68642"/><circle cx="37" cy="19" r="3.5" fill="#c68642"/><circle cx="47" cy="19" r="3.5" fill="#c68642"/>'
  + '<ellipse cx="50" cy="94" rx="40" ry="4" fill="#000" opacity=".12"/>',
);

export const swingSvg = () => svg(
  '<path d="M10 90 L28 12 H72 L90 90" stroke="#ef6c3a" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  + '<rect x="22" y="9" width="56" height="7" rx="3" fill="#ffca28"/>'
  + '<path d="M40 16 L36 68 M60 16 L64 68" stroke="#8d6e63" stroke-width="3.5" stroke-linecap="round"/>'
  + '<rect x="30" y="66" width="40" height="8" rx="3" fill="#e53935"/>'
  + '<circle cx="50" cy="54" r="9" fill="#c68642"/><circle cx="44" cy="47" r="3.5" fill="#c68642"/><circle cx="56" cy="47" r="3.5" fill="#c68642"/>'
  + '<ellipse cx="50" cy="95" rx="42" ry="4" fill="#000" opacity=".12"/>',
);

export const planeSvg = () => svg(
  '<ellipse cx="50" cy="56" rx="38" ry="15" fill="#e53935" stroke="#b71c1c" stroke-width="3"/>'
  + '<path d="M16 50 L6 30 L26 44Z" fill="#e53935" stroke="#b71c1c" stroke-width="3" stroke-linejoin="round"/>'
  + '<path d="M40 56 L24 88 H46 L62 58Z" fill="#ffd54f" stroke="#f9a825" stroke-width="3" stroke-linejoin="round"/>'
  + '<path d="M44 48 L30 18 H52 L64 46Z" fill="#ffd54f" stroke="#f9a825" stroke-width="3" stroke-linejoin="round"/>'
  + '<ellipse cx="62" cy="46" rx="13" ry="10" fill="#b3e5fc" stroke="#0288d1" stroke-width="3"/>'
  + '<circle cx="64" cy="45" r="6" fill="#c68642"/><circle cx="59" cy="39" r="3" fill="#c68642"/><circle cx="69" cy="39" r="3" fill="#c68642"/>'
  + '<rect x="86" y="42" width="4" height="30" rx="2" fill="#546e7a"/>',
);

export const ringSvg = (on = true) => svg(
  `<circle cx="50" cy="50" r="34" fill="none" stroke="${on ? '#ffc107' : '#b0bec5'}" stroke-width="12"/>`
  + `<circle cx="50" cy="50" r="34" fill="none" stroke="${on ? '#fff59d' : '#eceff1'}" stroke-width="4" stroke-dasharray="30 184" transform="rotate(-70 50 50)"/>`,
);

export const foxSvg = () => svg(
  '<path d="M18 48 L14 10 L40 30 Z" fill="#ff7a1f" stroke="#bf4a00" stroke-width="3" stroke-linejoin="round"/>'
  + '<path d="M82 48 L86 10 L60 30 Z" fill="#ff7a1f" stroke="#bf4a00" stroke-width="3" stroke-linejoin="round"/>'
  + '<path d="M20 20 L36 32 L24 40 Z" fill="#3b2a22"/><path d="M80 20 L64 32 L76 40 Z" fill="#3b2a22"/>'
  + '<path d="M14 42 Q16 26 50 26 Q84 26 86 42 Q86 64 50 88 Q14 64 14 42 Z" fill="#ff7a1f" stroke="#bf4a00" stroke-width="3" stroke-linejoin="round"/>'
  + '<path d="M22 50 Q36 52 50 72 Q64 52 78 50 Q72 70 50 88 Q28 70 22 50 Z" fill="#fff6ea"/>'
  + '<circle cx="37" cy="48" r="5" fill="#24160f"/><circle cx="63" cy="48" r="5" fill="#24160f"/>'
  + '<circle cx="38.5" cy="46.5" r="1.6" fill="#fff"/><circle cx="64.5" cy="46.5" r="1.6" fill="#fff"/>'
  + '<ellipse cx="50" cy="80" rx="6" ry="4.5" fill="#24160f"/>',
);

export const chickenSvg = () => svg(
  '<path d="M40 18 Q44 6 50 14 Q54 4 60 14 Q66 8 66 22 Z" fill="#ff3b3b"/>'
  + '<ellipse cx="50" cy="62" rx="32" ry="28" fill="#fffaf0" stroke="#bdb6a8" stroke-width="3"/>'
  + '<circle cx="52" cy="38" r="20" fill="#fffaf0" stroke="#bdb6a8" stroke-width="3"/>'
  + '<polygon points="70,38 86,43 70,48" fill="#ffae00" stroke="#e08a00" stroke-width="2" stroke-linejoin="round"/>'
  + '<path d="M68 50 Q74 58 66 60 Q62 54 68 50 Z" fill="#ff3b3b"/>'
  + '<circle cx="58" cy="34" r="4.5" fill="#24160f"/><circle cx="59.5" cy="32.5" r="1.4" fill="#fff"/>'
  + '<path d="M26 60 Q40 50 50 66 Q38 76 26 60 Z" fill="#efe6d4"/>'
  + '<path d="M42 88 V96 M58 88 V96" stroke="#ffae00" stroke-width="4" stroke-linecap="round"/>',
);

/** A balloon on a string; `color` is a 0xRRGGBB number. */
export function balloonSvg(color, on = true) {
  const c = on ? hex(color) : '#cfd8dc';
  return svg(
    `<path d="M50 70 Q44 82 52 90 Q58 96 50 99" stroke="#8d8d8d" stroke-width="2.5" fill="none"/>`
    + `<ellipse cx="50" cy="38" rx="27" ry="32" fill="${c}"/>`
    + `<polygon points="45,70 55,70 50,64" fill="${c}"/>`
    + '<ellipse cx="39" cy="26" rx="7" ry="11" fill="#fff" opacity=".45" transform="rotate(20 39 26)"/>',
  );
}

/**
 * Number card: the digit with that many dots under it, so it reads without knowing digits.
 * One colour for every number, so no number gets tied to a colour word.
 */
export function numberSvg(n) {
  const col = '#ef6c3a';
  const xs = { 1: [50], 2: [38, 62], 3: [26, 50, 74], 4: [20, 40, 60, 80], 5: [14, 32, 50, 68, 86] }[n] || [];
  const dots = xs.map((x) => `<circle cx="${x}" cy="86" r="7.5" fill="${col}"/>`).join('');
  return svg(
    `<text x="50" y="66" text-anchor="middle" font-family="Segoe UI, Arial Rounded MT Bold, Arial, sans-serif" font-size="66" font-weight="900" fill="${col}" stroke="#fff" stroke-width="3" paint-order="stroke">${n}</text>`
    + dots,
  );
}

/** A leafy bush with a question mark: "someone is hiding". */
export const hideSvg = () => svg(
  '<circle cx="30" cy="66" r="22" fill="#4caf50"/><circle cx="70" cy="66" r="22" fill="#4caf50"/>'
  + '<circle cx="50" cy="52" r="26" fill="#66bb6a"/><ellipse cx="50" cy="86" rx="40" ry="8" fill="#388e3c"/>'
  + '<text x="50" y="66" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="900" fill="#fff">?</text>',
);

export const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five'];

const ANIMAL_SVG = {
  cat: catSvg, duck: duckSvg, frog: frogSvg, rabbit: rabbitSvg, bird: birdSvg, fox: foxSvg, chicken: chickenSvg,
};
const TOY_SVG = { slide: slideSvg, swing: swingSvg, plane: planeSvg };

/** Picture of a thing to find in the world. */
export function itemIcon(word) {
  if (NUMBER_WORDS.includes(word)) return numberSvg(NUMBER_WORDS.indexOf(word) + 1);
  if (word === 'apple') return appleSvg();
  if (word === 'banana') return bananaSvg();
  if (word === 'jump') return starSvg();
  if (ANIMAL_SVG[word]) return ANIMAL_SVG[word]();
  if (TOY_SVG[word]) return TOY_SVG[word]();
  if (COLORS[word]) return flowerSvg(COLORS[word]);
  return starSvg();
}

/** Picture used on a choose card: colors become paint blobs. */
export function cardIcon(word) {
  if (NUMBER_WORDS.includes(word)) return numberSvg(NUMBER_WORDS.indexOf(word) + 1);
  if (word === 'apple') return appleSvg();
  if (word === 'banana') return bananaSvg();
  if (word === 'jump') return starSvg();
  if (ANIMAL_SVG[word]) return ANIMAL_SVG[word]();
  if (TOY_SVG[word]) return TOY_SVG[word]();
  if (COLORS[word]) return blobSvg(COLORS[word]);
  return starSvg();
}
