// Room backgrounds for each screen layout. Each piece is a full-stage SVG
// (1280×800) stacked as a layer, so characters can stand between them.

import { C, INK, ink, svg, seeded } from './common.js';

export const STAGE_W = 1280;
export const STAGE_H = 800;

export const WALLS = {
  sunny: { wall: '#ffe9ad', accent: '#ffdd8e', trim: '#f3b54c', panel: '#f8cf7c', kind: 'stripes' },
  mint: { wall: '#cff3e1', accent: '#b4e9d0', trim: '#58b98a', panel: '#9adfc0', kind: 'dots' },
  berry: { wall: '#ffd9e4', accent: '#ffc3d5', trim: '#e86a92', panel: '#ffb1c8', kind: 'stripes' },
  sky: { wall: '#c6e8ff', accent: '#ffffff', trim: '#4d9de0', panel: '#a5d6fb', kind: 'clouds' },
  night: { wall: '#323d7a', accent: '#ffe27a', trim: '#1f2757', panel: '#28316a', kind: 'stars' },
};

function wallpaper(theme, x, y, w, h) {
  const t = WALLS[theme] || WALLS.sunny;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${t.wall}"/>`;
  if (t.kind === 'stripes') {
    for (let sx = x + 30; sx < x + w; sx += 90) out += `<rect x="${sx}" y="${y}" width="42" height="${h}" fill="${t.accent}"/>`;
  } else if (t.kind === 'dots') {
    let row = 0;
    for (let dy = y + 30; dy < y + h; dy += 56, row++) {
      for (let dx = x + (row % 2 ? 58 : 20); dx < x + w; dx += 76) out += `<circle cx="${dx}" cy="${dy}" r="9" fill="${t.accent}"/>`;
    }
  } else if (t.kind === 'clouds') {
    for (let i = 0; i < Math.ceil(w / 150); i++) {
      const cx = x + 60 + i * 150 + seeded(i, 1) * 50;
      const cy = y + 40 + seeded(i, 2) * (h - 90);
      out += `<path d="M${cx - 44} ${cy} q-4 -22 20 -22 q8 -18 30 -8 q26 -6 28 16 q18 2 12 16 h-86 q-12 -2 -4 -2z" fill="${t.accent}" opacity=".9"/>`;
    }
  } else if (t.kind === 'stars') {
    for (let i = 0; i < Math.ceil((w * h) / 9000); i++) {
      const cx = x + seeded(i, 5) * w;
      const cy = y + seeded(i, 6) * h;
      const r = 4 + seeded(i, 7) * 7;
      out += `<path d="M${cx} ${cy - r} l${r * 0.3} ${r * 0.7} l${r * 0.7} ${r * 0.3} l${-r * 0.7} ${r * 0.3} l${-r * 0.3} ${r * 0.7} l${-r * 0.3} ${-r * 0.7} l${-r * 0.7} ${-r * 0.3} l${r * 0.7} ${-r * 0.3}z" fill="${t.accent}" opacity="${0.5 + seeded(i, 8) * 0.5}"/>`;
    }
  }
  return out;
}

function checkerFloor(x, y, w, h, a = '#f6e3c2', b = '#eccf9f', size = 80) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${a}"/>`;
  let row = 0;
  for (let fy = y; fy < y + h; fy += size, row++) {
    for (let fx = x + (row % 2 ? size : 0); fx < x + w; fx += size * 2) {
      out += `<rect x="${fx}" y="${fy}" width="${Math.min(size, x + w - fx)}" height="${Math.min(size, y + h - fy)}" fill="${b}"/>`;
    }
  }
  return out;
}

function woodFloor(x, y, w, h) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e2b77c"/>`;
  let row = 0;
  for (let fy = y; fy < y + h; fy += 46, row++) {
    out += `<path d="M${x} ${fy} h${w}" stroke="#c9995c" stroke-width="3"/>`;
    for (let fx = x + (row % 2 ? 110 : 20); fx < x + w; fx += 220) out += `<path d="M${fx} ${fy} v46" stroke="#c9995c" stroke-width="3"/>`;
  }
  return out;
}

function tiles(x, y, w, h, fill = '#fdfaf2', line = '#e6dcc6', size = 64) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
  for (let tx = x + size; tx < x + w; tx += size) out += `<path d="M${tx} ${y} v${h}" stroke="${line}" stroke-width="3"/>`;
  for (let ty = y + size; ty < y + h; ty += size) out += `<path d="M${x} ${ty} h${w}" stroke="${line}" stroke-width="3"/>`;
  return out;
}

const full = (inner) => svg(`0 0 ${STAGE_W} ${STAGE_H}`, inner, 'preserveAspectRatio="none"');

// ------------------------------------------------------- Layout 1: counter

export function scene1(theme) {
  const t = WALLS[theme] || WALLS.sunny;
  const wall = full(`
    ${wallpaper(theme, 0, 0, STAGE_W, 340)}
    <rect x="0" y="330" width="${STAGE_W}" height="120" fill="${t.panel}"/>
    <rect x="0" y="322" width="${STAGE_W}" height="16" fill="${t.trim}" ${ink(4)}/>
    ${checkerFloor(0, 450, STAGE_W, 350)}
    <path d="M0 450 h${STAGE_W}" ${ink(5)}/>`);
  let planks = '';
  for (let x = 300; x < 1040; x += 92) planks += `<path d="M${x} 440 v84" stroke="${C.woodDark}" stroke-width="3" opacity=".6"/>`;
  const counter = full(`
    <ellipse cx="640" cy="532" rx="430" ry="12" fill="#000" opacity=".12"/>
    <rect x="232" y="424" width="816" height="104" rx="10" fill="${C.wood}" ${ink(5)}/>
    ${planks}
    <rect x="252" y="452" width="776" height="56" rx="8" fill="none" stroke="${C.woodDark}" stroke-width="3" opacity=".5"/>
    <rect x="216" y="384" width="848" height="50" rx="18" fill="#fbe3b9" ${ink(5)}/>
    <path d="M236 396 h808" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>`);
  const worktop = full(`
    <rect x="-20" y="552" width="1320" height="270" fill="#fdf2de" ${ink(5)}/>
    <rect x="-20" y="552" width="1320" height="20" fill="#ead6b4"/>
    <path d="M-20 552 h1320" ${ink(5)}/>
    <path d="M-20 572 h1320" stroke="#d9c29b" stroke-width="3"/>
    <g fill="#ecdcc0">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(seeded(i, 11) * 1280).toFixed(0)}" cy="${(590 + seeded(i, 12) * 200).toFixed(0)}" r="${(2 + seeded(i, 13) * 3).toFixed(1)}"/>`).join('')}</g>`);
  return { wall, counter, worktop };
}

// -------------------------------------------------- Layout 2: split kitchen

export function scene2(theme, stationRects = []) {
  const t = WALLS[theme] || WALLS.sunny;
  const split = 660;
  let slabs = '';
  const rows = [...new Set(stationRects.map((r) => r.y + r.h))];
  for (const bottom of rows) {
    slabs += `<rect x="-10" y="${bottom - 26}" width="${split - 96}" height="30" rx="8" fill="#fbe3b9" ${ink(5)}/>
      <path d="M8 ${bottom - 17} h${split - 130}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  }
  const wall = full(`
    ${tiles(0, 0, split, STAGE_H)}
    ${wallpaper(theme, split, 0, STAGE_W - split, 348)}
    <rect x="${split}" y="338" width="${STAGE_W - split}" height="16" fill="${t.trim}" ${ink(4)}/>
    ${woodFloor(split, 354, STAGE_W - split, STAGE_H - 354)}
    ${checkerFloor(split - 104, 84, 104, STAGE_H - 84, '#f6e3c2', '#eccf9f', 52)}
    <path d="M${split - 104} 84 v${STAGE_H}" stroke="#d9c29b" stroke-width="4"/>
    ${slabs}
    <rect x="${split - 12}" y="0" width="24" height="${STAGE_H}" fill="${t.panel}" ${ink(5)}/>
    <rect x="${split - 20}" y="84" width="40" height="26" rx="8" fill="${t.trim}" ${ink(4)}/>`);
  return { wall };
}

/** A dining table with a cloth, drawn in a 260×150 box. */
export function tableSvg(cloth = C.red) {
  return svg('0 0 260 150', `
    <ellipse cx="130" cy="142" rx="104" ry="8" fill="#000" opacity=".12"/>
    <rect x="118" y="60" width="24" height="80" rx="8" fill="${C.woodDark}" ${ink(4)}/>
    <path d="M14 34 h232 l-10 60 q-106 16 -212 0z" fill="${cloth}" ${ink(5)}/>
    <g fill="#fff" opacity=".85"><circle cx="50" cy="66" r="7"/><circle cx="90" cy="78" r="7"/><circle cx="130" cy="68" r="7"/><circle cx="170" cy="78" r="7"/><circle cx="210" cy="66" r="7"/></g>
    <ellipse cx="130" cy="30" rx="124" ry="24" fill="#fff8ea" ${ink(5)}/>
    <ellipse cx="130" cy="29" rx="110" ry="17" fill="none" stroke="${cloth}" stroke-width="4" opacity=".6"/>`);
}

// --------------------------------------------------- Layout 3: chef's eye

export function scene3(theme) {
  const t = WALLS[theme] || WALLS.sunny;
  let boards = '';
  for (let i = 0; i <= 10; i++) {
    const xTop = 200 + i * 88;
    const xBot = -160 + i * 160;
    boards += `<path d="M${xTop} 356 L${xBot} 800" stroke="#c9995c" stroke-width="3"/>`;
  }
  const wall = full(`
    ${tiles(0, 0, STAGE_W, 360, '#fdfaf2', '#e6dcc6', 60)}
    <rect x="236" y="96" width="808" height="244" rx="20" fill="${t.trim}" ${ink(6)}/>
    <clipPath id="hatch-clip"><rect x="254" y="112" width="772" height="216" rx="10"/></clipPath>
    <g clip-path="url(#hatch-clip)">${wallpaper(theme, 254, 112, 772, 216)}</g>
    <rect x="254" y="112" width="772" height="216" rx="10" fill="none" ${ink(5)}/>`);
  const hatch = full(`
    <rect x="220" y="318" width="840" height="46" rx="16" fill="#fbe3b9" ${ink(5)}/>
    <path d="M240 330 h800" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>
    <path d="M0 364 h1280 v436 h-1280z" fill="#e7bd82"/>
    ${boards}
    <path d="M0 364 h1280" ${ink(5)}/>
    <rect x="-10" y="364" width="1300" height="16" fill="#d3a467"/>`);
  return { wall, hatch };
}

/** The chef's two paws at the bottom of the chef's-eye view. */
export function pawsSvg(fur = '#f28b3a', sleeve = '#ffffff') {
  const paw = (x, flip) => `<g transform="translate(${x} 0) scale(${flip ? -1 : 1} 1)">
      <path d="M-46 130 q-6 -70 30 -84 q40 -10 52 30 l-4 54z" fill="${sleeve}" ${ink(5)}/>
      <path d="M-34 60 q-10 -40 18 -52 q34 -10 44 22 q6 26 -10 40 q-30 14 -52 -10z" fill="${fur}" ${ink(5)}/>
      <path d="M-10 16 v16 M8 12 v18" ${ink(4)}/>
    </g>`;
  return svg('0 0 420 130', `${paw(80, false)}${paw(340, true)}`);
}

// ------------------------------------------------------------------ window

/** Window with a sky that changes through the session (set --sky etc. in CSS). */
export function windowSvg() {
  return svg('0 0 200 180', `
    <rect x="14" y="12" width="172" height="146" rx="10" class="sky" fill="#8fd4ff"/>
    <circle class="sun" cx="60" cy="60" r="20" fill="${C.yellow}" ${ink(3)}/>
    <g class="stars" fill="#fff" opacity="0"><circle cx="46" cy="40" r="3"/><circle cx="92" cy="30" r="2.5"/><circle cx="150" cy="48" r="3"/><circle cx="124" cy="76" r="2"/><circle cx="70" cy="84" r="2"/></g>
    <g class="cloud c1" fill="#fff" opacity=".95"><path d="M96 96 q-2 -14 14 -14 q6 -12 22 -6 q18 -4 18 12 q12 2 8 10 h-58 q-8 0 -4 -2z"/></g>
    <g class="cloud c2" fill="#fff" opacity=".8"><path d="M26 126 q-2 -10 10 -10 q6 -8 16 -4 q12 -2 12 8 q8 2 6 8 h-42 q-4 0 -2 -2z"/></g>
    <path d="M14 132 q40 -26 86 -6 q46 -22 86 2 v30 h-172z" class="hills" fill="#7ccf68"/>
    <rect x="14" y="12" width="172" height="146" rx="10" fill="none" ${ink(5)}/>
    <path d="M100 12 v146 M14 84 h172" ${ink(5)}/>
    <rect x="4" y="154" width="192" height="18" rx="8" fill="#fff8ea" ${ink(5)}/>
    <path d="M14 12 q8 44 -6 80 l-4 -78z" fill="${C.red}" ${ink(4)}/><path d="M186 12 q-8 44 6 80 l4 -78z" fill="${C.red}" ${ink(4)}/>
    <rect x="0" y="4" width="200" height="14" rx="7" fill="${C.wood}" ${ink(4)}/>`);
}

/** Sky colours for a session progress 0..1: morning → noon → sunset → night. */
export function skyAt(p) {
  const stops = [
    [0.0, [255, 214, 165]],
    [0.15, [143, 212, 255]],
    [0.6, [120, 196, 255]],
    [0.82, [255, 170, 110]],
    [1.0, [47, 58, 120]],
  ];
  const q = Math.max(0, Math.min(1, p));
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (q >= stops[i][0] && q <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const f = b[0] === a[0] ? 0 : (q - a[0]) / (b[0] - a[0]);
  const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
  return { color: `rgb(${c[0]},${c[1]},${c[2]})`, night: q > 0.9, sunX: 30 + q * 150, sunY: 40 + Math.pow(q * 2 - 1, 2) * 60 };
}

void INK;

// ------------------------------------------------------------ menu backdrop

/** A cosy room backdrop for the menus (home, hub, shop, summary). */
export function menuScene(theme = 'sunny') {
  const t = WALLS[theme] || WALLS.sunny;
  return full(`
    ${wallpaper(theme, 0, 0, STAGE_W, 600)}
    <rect x="0" y="560" width="${STAGE_W}" height="60" fill="${t.panel}"/>
    <rect x="0" y="552" width="${STAGE_W}" height="16" fill="${t.trim}" ${ink(4)}/>
    ${checkerFloor(0, 620, STAGE_W, 180)}
    <path d="M0 620 h${STAGE_W}" ${ink(5)}/>`);
}

/** Small swatch of a wall theme for the shop. */
export function wallSwatch(theme) {
  const t = WALLS[theme] || WALLS.sunny;
  return svg('0 0 100 100', `
    <clipPath id="sw-${theme}"><rect x="6" y="6" width="88" height="88" rx="14"/></clipPath>
    <g clip-path="url(#sw-${theme})"><g transform="scale(.42)">${wallpaper(theme, 0, 0, 240, 240)}</g>
    <rect x="6" y="70" width="88" height="24" fill="${t.panel}"/><rect x="6" y="66" width="88" height="7" fill="${t.trim}"/></g>
    <rect x="6" y="6" width="88" height="88" rx="14" fill="none" ${ink(5)}/>`);
}
