// Shared helpers for the hand-drawn SVG art. Everything in the game is drawn
// in code: no image files, so it stays crisp on any tablet.

export const INK = '#4a2b17';

export const C = {
  cream: '#fff4dc',
  white: '#ffffff',
  wood: '#d59a5b',
  woodDark: '#b0733a',
  woodLight: '#ecc18a',
  red: '#ef5b4c',
  redDark: '#c93f33',
  orange: '#ff9a3d',
  yellow: '#ffd84a',
  green: '#6cc35b',
  greenDark: '#3f9a44',
  teal: '#3fb8af',
  blue: '#4d9de0',
  blueDark: '#2f74b5',
  purple: '#9b6fd6',
  pink: '#ff8fb1',
  steel: '#cfd8e0',
  steelDark: '#9aa7b3',
  char: '#3a3a40',
};

/** Outline attributes: thick, round, friendly. */
export function ink(width = 4, color = INK) {
  return `stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
}

export function svg(viewBox, inner, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${extra} aria-hidden="true">${inner}</svg>`;
}

export function star(cx, cy, r, fill = C.yellow, width = 4) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.48;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${ink(width)}/>`;
}

export function coin(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffc531" ${ink(Math.max(2, r * 0.14))}/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.66}" fill="#ffe27a" stroke="#e09a12" stroke-width="${Math.max(1.5, r * 0.09)}"/>
    <path d="M${cx - r * 0.2} ${cy - r * 0.32} q${r * 0.5} ${-r * 0.12} ${r * 0.34} ${r * 0.3} q${-r * 0.5} ${r * 0.1} ${-r * 0.34} ${r * 0.34}" fill="none" stroke="#e09a12" stroke-width="${Math.max(1.5, r * 0.12)}" stroke-linecap="round"/>`;
}

export function heart(cx, cy, s, fill = C.red) {
  return `<path d="M${cx} ${cy + s * 0.9} C${cx - s * 1.5} ${cy - s * 0.2} ${cx - s * 0.6} ${cy - s * 1.2} ${cx} ${cy - s * 0.3} C${cx + s * 0.6} ${cy - s * 1.2} ${cx + s * 1.5} ${cy - s * 0.2} ${cx} ${cy + s * 0.9}Z" fill="${fill}" ${ink(3)}/>`;
}

/** Deterministic pick from a list using an integer seed. */
export function seeded(seed, salt = 0) {
  let h = (Math.imul((seed | 0) + 0x9e3779b9, 0x85ebca6b) ^ Math.imul((salt | 0) + 0x7f4a7c15, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html != null) e.innerHTML = html;
  return e;
}
