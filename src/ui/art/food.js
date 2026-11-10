// Food pictures (for order bubbles and served plates), action icons (what the
// next cooking step is) and ingredient icons (what a station is stocked with).
// All drawn in a 100×100 box.

import { C, INK, ink, svg } from './common.js';

const plate = `<ellipse cx="50" cy="76" rx="45" ry="15" fill="#fff" ${ink(4)}/>
  <ellipse cx="50" cy="75" rx="31" ry="8.5" fill="#e8eef4"/>`;

const steam = (x, y) => `<path class="wisp" d="M${x} ${y} q-6 -7 0 -13 q6 -6 0 -13" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>
  <path class="wisp" d="M${x} ${y} q-6 -7 0 -13 q6 -6 0 -13" fill="none" stroke="#b9c7d3" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;

const FOODS = {
  pancakes: () => `${plate}
    <g ${ink(4)}>
      <path d="M21 62 q0 -9 29 -9 q29 0 29 9 v5 q0 9 -29 9 q-29 0 -29 -9z" fill="#e59a45"/>
      <ellipse cx="50" cy="62" rx="29" ry="9" fill="#f6c573"/>
      <path d="M23 49 q0 -9 27 -9 q27 0 27 9 v5 q0 9 -27 9 q-27 0 -27 -9z" fill="#e59a45"/>
      <ellipse cx="50" cy="49" rx="27" ry="9" fill="#f6c573"/>
      <path d="M25 36 q0 -9 25 -9 q25 0 25 9 v5 q0 9 -25 9 q-25 0 -25 -9z" fill="#e59a45"/>
      <ellipse cx="50" cy="36" rx="25" ry="9" fill="#f8cf85"/>
    </g>
    <path d="M30 35 q8 -7 20 -6 q14 0 20 6 q2 6 -4 5 q-2 9 -6 2 q-6 3 -12 1 q-3 12 -7 0 q-10 0 -11 -8z" fill="#9a4f1d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="41" y="23" width="18" height="11" rx="3" fill="${C.yellow}" ${ink(3)} transform="rotate(-8 50 28)"/>`,

  mac: () => `<path d="M10 50 q2 38 40 38 q38 0 40 -38z" fill="${C.blue}" ${ink(4)}/>
    <path d="M22 70 q28 14 56 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="50" cy="50" rx="40" ry="13" fill="#ffc93a" ${ink(4)}/>
    <g fill="none" stroke="#f39c12" stroke-width="6" stroke-linecap="round">
      <path d="M24 49 q6 -9 13 -2"/><path d="M42 44 q7 -8 13 0"/><path d="M60 47 q7 -8 13 1"/>
      <path d="M33 55 q7 -7 13 1"/><path d="M52 54 q7 -6 12 2"/>
    </g>
    <g fill="none" stroke="#ffe58a" stroke-width="2.5" stroke-linecap="round">
      <path d="M25 48 q5 -7 11 -2"/><path d="M43 43 q6 -6 11 0"/><path d="M61 46 q6 -6 11 1"/>
    </g>`,

  toast: () => `${plate}
    <path d="M27 34 q-9 -3 -6 -13 q4 -10 16 -8 q13 -8 26 0 q12 -2 16 8 q3 10 -6 13 l-1 34 q0 6 -6 6 h-32 q-6 0 -6 -6z" fill="#c8823a" ${ink(4)}/>
    <path d="M33 34 q-7 -3 -5 -9 q3 -6 11 -5 q11 -6 22 0 q8 -1 11 5 q2 6 -5 9 l-1 28 q0 4 -4 4 h-24 q-4 0 -4 -4z" fill="#f7cf8a"/>
    <rect x="39" y="38" width="22" height="16" rx="4" fill="${C.yellow}" ${ink(3)} transform="rotate(-10 50 46)"/>
    <path d="M43 42 l7 -2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,

  soup: () => `<path d="M10 50 q2 38 40 38 q38 0 40 -38z" fill="${C.red}" ${ink(4)}/>
    <path d="M22 70 q28 14 56 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>
    <ellipse cx="50" cy="50" rx="40" ry="13" fill="#ff9d2e" ${ink(4)}/>
    <circle cx="36" cy="49" r="5" fill="#ff6b2b" ${ink(2)}/><circle cx="60" cy="52" r="5" fill="#ff6b2b" ${ink(2)}/>
    <circle cx="49" cy="46" r="3.5" fill="${C.green}" ${ink(2)}/><circle cx="68" cy="46" r="3.5" fill="${C.green}" ${ink(2)}/>
    <circle cx="28" cy="53" r="3" fill="${C.green}" ${ink(2)}/>
    ${steam(40, 34)}${steam(60, 32)}`,

  grilled: () => `${plate}
    <path d="M14 66 l30 -40 l8 40z" fill="#e9a04b" ${ink(4)}/>
    <path d="M52 68 l6 -40 l30 38z" fill="#e9a04b" ${ink(4)}/>
    <path d="M18 66 q6 8 10 0 q5 7 9 0 q5 6 9 0 l4 0 l-6 -6 l-22 0z" fill="${C.yellow}" ${ink(3)}/>
    <path d="M56 68 q5 7 9 0 q5 8 9 0 q5 6 9 -1 l-4 -6 l-22 1z" fill="${C.yellow}" ${ink(3)}/>
    <g stroke="#b56a25" stroke-width="3" stroke-linecap="round"><path d="M32 46 l8 12"/><path d="M26 54 l7 8"/><path d="M62 44 l10 12"/><path d="M60 54 l12 9"/></g>`,

  fries: () => `<g ${ink(3)} fill="#ffd24a">
      <rect x="27" y="14" width="9" height="46" rx="3" transform="rotate(-9 31 40)"/>
      <rect x="38" y="8" width="9" height="50" rx="3" transform="rotate(-3 42 40)"/>
      <rect x="49" y="10" width="9" height="50" rx="3" transform="rotate(4 53 40)"/>
      <rect x="60" y="15" width="9" height="46" rx="3" transform="rotate(10 64 40)"/>
      <rect x="44" y="20" width="9" height="40" rx="3"/>
    </g>
    <path d="M20 42 q30 12 60 0 l-8 46 q-22 6 -44 0z" fill="${C.red}" ${ink(4)}/>
    <path d="M36 62 q14 -10 28 0 q-14 10 -28 0z" fill="${C.yellow}" ${ink(3)}/>`,

  cookies: () => `${plate}
    <g ${ink(4)}>
      <circle cx="33" cy="58" r="19" fill="#dea05a"/>
      <circle cx="67" cy="58" r="19" fill="#dea05a"/>
      <circle cx="50" cy="40" r="20" fill="#e8ae68"/>
    </g>
    <g fill="#6b3a1e">
      <circle cx="27" cy="54" r="3.5"/><circle cx="38" cy="64" r="3.5"/><circle cx="30" cy="66" r="2.5"/>
      <circle cx="72" cy="52" r="3.5"/><circle cx="63" cy="64" r="3.5"/><circle cx="74" cy="65" r="2.5"/>
      <circle cx="44" cy="34" r="4"/><circle cx="57" cy="38" r="4"/><circle cx="48" cy="48" r="3.5"/><circle cx="58" cy="28" r="2.5"/>
    </g>`,

  juice: () => `<path d="M30 22 h40 l-6 62 q-14 6 -28 0z" fill="#eaf6ff" ${ink(4)}/>
    <path d="M32.5 40 h35 l-4.5 42 q-13 5 -26 0z" fill="${C.orange}"/>
    <path d="M32.5 40 q17 6 35 0" fill="none" stroke="#ffc27a" stroke-width="4"/>
    <path d="M56 46 l14 -40 l10 -2" fill="none" stroke="${C.red}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M38 30 l-2 40" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`,
};

export function foodInner(id) {
  return (FOODS[id] || FOODS.toast)();
}

export function foodIcon(id, extra = '') {
  return svg('0 0 100 100', foodInner(id), extra);
}

// --------------------------------------------------------------- actions

const arrowUp = (x, y, s = 1, color = C.green) => `<path d="M${x} ${y - 16 * s} l${15 * s} ${17 * s} h${-9 * s} v${15 * s} h${-12 * s} v${-15 * s} h${-9 * s}z" fill="${color}" ${ink(3.5)}/>`;
const arrowDown = (x, y, s = 1, color = C.green) => `<path d="M${x} ${y + 16 * s} l${15 * s} ${-17 * s} h${-9 * s} v${-15 * s} h${-12 * s} v${15 * s} h${-9 * s}z" fill="${color}" ${ink(3.5)}/>`;
const curveArrow = `<path d="M22 46 q4 -30 34 -30 q16 0 24 12" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
  <path d="M22 46 q4 -30 34 -30 q16 0 24 12" fill="none" stroke="${C.green}" stroke-width="7" stroke-linecap="round"/>
  <path d="M90 14 l-2 24 l-21 -10z" fill="${C.green}" ${ink(3.5)}/>`;

const ACTIONS = {
  flip: () => `${curveArrow}
    <ellipse cx="48" cy="60" rx="24" ry="9" fill="#f6c573" ${ink(4)}/>
    <path d="M18 88 l26 -16" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M18 88 l26 -16" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/>
    <path d="M40 68 l34 -8 l6 14 l-32 12z" fill="${C.steel}" ${ink(4)}/>`,
  plate: () => `${arrowDown(50, 32, 1.1)}
    <ellipse cx="50" cy="76" rx="42" ry="14" fill="#fff" ${ink(4)}/>
    <ellipse cx="50" cy="75" rx="28" ry="8" fill="#e8eef4"/>`,
  drain: () => `<path d="M12 34 h76 q-2 34 -38 34 q-36 0 -38 -34z" fill="${C.steel}" ${ink(4)}/>
    <ellipse cx="50" cy="34" rx="38" ry="9" fill="#ffd24a" ${ink(4)}/>
    <g fill="${INK}"><circle cx="32" cy="50" r="3"/><circle cx="44" cy="54" r="3"/><circle cx="56" cy="54" r="3"/><circle cx="68" cy="50" r="3"/><circle cx="50" cy="45" r="3"/></g>
    <g fill="${C.blue}" ${ink(2.5)}><path d="M34 74 q5 8 0 12 q-5 -4 0 -12z"/><path d="M50 78 q5 8 0 12 q-5 -4 0 -12z"/><path d="M66 74 q5 8 0 12 q-5 -4 0 -12z"/></g>`,
  cheese: () => `<path d="M10 66 l62 -36 q16 12 18 36z" fill="#ffc531" ${ink(4)}/>
    <path d="M10 66 h80 v16 h-80z" fill="#ffab1f" ${ink(4)}/>
    <circle cx="56" cy="54" r="7" fill="#e89512" ${ink(2.5)}/><circle cx="34" cy="74" r="5" fill="#e07f0c" ${ink(2.5)}/>
    <circle cx="74" cy="60" r="4" fill="#e89512" ${ink(2.5)}/><circle cx="66" cy="75" r="4" fill="#e07f0c" ${ink(2.5)}/>`,
  pop: () => `${arrowUp(50, 26, 1.1)}
    <path d="M30 60 q-7 -2 -5 -10 q3 -7 12 -6 q13 -6 26 0 q9 -1 12 6 q2 8 -5 10 v26 h-40z" fill="#f7cf8a" stroke="#c8823a" stroke-width="6" stroke-linejoin="round"/>
    <path d="M30 60 q-7 -2 -5 -10 q3 -7 12 -6 q13 -6 26 0 q9 -1 12 6 q2 8 -5 10 v26 h-40z" fill="none" ${ink(3)}/>`,
  butter: () => `<path d="M16 52 l40 -14 l26 12 l-40 16z" fill="#ffe27a" ${ink(4)}/>
    <path d="M16 52 v16 l26 14 v-16z" fill="#ffc531" ${ink(4)}/>
    <path d="M42 66 l40 -16 v16 l-40 16z" fill="#ffd24a" ${ink(4)}/>
    <path d="M52 30 l36 -18 q6 6 -2 12 l-30 14z" fill="${C.steel}" ${ink(3.5)}/>`,
  stir: () => `${curveArrow}
    <ellipse cx="38" cy="66" rx="13" ry="17" fill="${C.wood}" ${ink(4)} transform="rotate(-38 38 66)"/>
    <path d="M48 56 l34 -22" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
    <path d="M48 56 l34 -22" stroke="${C.wood}" stroke-width="5.5" stroke-linecap="round"/>`,
  ladle: () => `<path d="M62 14 q10 2 6 12 l-16 36" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M62 14 q10 2 6 12 l-16 36" fill="none" stroke="${C.steel}" stroke-width="6" stroke-linecap="round"/>
    <path d="M22 60 h50 q0 26 -25 26 q-25 0 -25 -26z" fill="${C.steel}" ${ink(4)}/>
    <ellipse cx="47" cy="60" rx="25" ry="7" fill="#ff9d2e" ${ink(4)}/>`,
  lift: () => `${arrowUp(30, 30, 1)}
    <path d="M30 50 h54 l-6 36 h-42z" fill="${C.steel}" ${ink(4)}/>
    <g stroke="${INK}" stroke-width="2.5"><path d="M34 62 h48"/><path d="M36 74 h44"/><path d="M46 50 l2 36"/><path d="M58 50 v36"/><path d="M70 50 l-2 36"/></g>
    <path d="M84 50 l10 -22" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M84 50 l10 -22" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>
    <g fill="#ffd24a" ${ink(2.5)}><rect x="40" y="38" width="7" height="18" rx="2" transform="rotate(-10 43 47)"/><rect x="53" y="36" width="7" height="20" rx="2"/><rect x="66" y="38" width="7" height="18" rx="2" transform="rotate(10 69 47)"/></g>`,
  salt: () => `<g transform="rotate(28 50 50)">
      <rect x="34" y="12" width="32" height="14" rx="5" fill="${C.steel}" ${ink(4)}/>
      <path d="M32 26 h36 l4 40 q-22 8 -44 0z" fill="#fff" ${ink(4)}/>
      <g fill="${INK}"><circle cx="44" cy="19" r="2"/><circle cx="50" cy="19" r="2"/><circle cx="56" cy="19" r="2"/></g>
      <path d="M40 40 q10 6 20 0" fill="none" stroke="${C.blue}" stroke-width="4" stroke-linecap="round"/>
    </g>
    <g fill="#fff" ${ink(2)}><circle cx="24" cy="48" r="3.5"/><circle cx="16" cy="64" r="3.5"/><circle cx="32" cy="68" r="3.5"/><circle cx="22" cy="84" r="3.5"/></g>`,
  takeout: () => `<path d="M30 88 v-26 q-16 -6 -14 -24 q2 -22 22 -22 q12 0 18 10 q6 -8 14 -2 q8 8 -2 22 l-6 16 v26z" fill="${C.red}" ${ink(4)}/>
    <path d="M30 74 h32" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <path d="M26 40 q6 -12 16 -8" fill="none" stroke="#ff9d8f" stroke-width="5" stroke-linecap="round"/>
    ${arrowUp(82, 62, 0.75)}`,
  sprinkle: () => `<g ${ink(2.5)}>
      <rect x="18" y="20" width="14" height="6" rx="3" fill="${C.pink}" transform="rotate(30 25 23)"/>
      <rect x="46" y="12" width="14" height="6" rx="3" fill="${C.blue}" transform="rotate(-20 53 15)"/>
      <rect x="70" y="24" width="14" height="6" rx="3" fill="${C.yellow}" transform="rotate(50 77 27)"/>
      <rect x="30" y="40" width="14" height="6" rx="3" fill="${C.green}" transform="rotate(-40 37 43)"/>
      <rect x="58" y="42" width="14" height="6" rx="3" fill="${C.purple}" transform="rotate(15 65 45)"/>
    </g>
    <circle cx="50" cy="74" r="20" fill="#e8ae68" ${ink(4)}/>
    <g fill="#6b3a1e"><circle cx="44" cy="68" r="3.5"/><circle cx="57" cy="72" r="3.5"/><circle cx="48" cy="82" r="3"/></g>`,
};
ACTIONS.serve = ACTIONS.plate;

export function actionInner(action) {
  return (ACTIONS[action] || ACTIONS.plate)();
}

export function actionIcon(action, extra = '') {
  return svg('0 0 100 100', actionInner(action), extra);
}

// ----------------------------------------------------------- ingredients

const INGREDIENTS = {
  stove: () => `<rect x="22" y="14" width="56" height="74" rx="6" fill="${C.blue}" ${ink(4)}/>
    <rect x="22" y="14" width="56" height="16" rx="6" fill="${C.blueDark}" ${ink(4)}/>
    <ellipse cx="50" cy="58" rx="19" ry="17" fill="#fff" ${ink(3)}/>
    <g fill="none" stroke="#f39c12" stroke-width="5" stroke-linecap="round"><path d="M38 56 q6 -8 12 -1"/><path d="M50 62 q6 -8 12 0"/></g>`,
  griddle: () => `<path d="M50 10 q30 34 30 54 q0 26 -30 26 q-30 0 -30 -26 q0 -20 30 -54z" fill="#fff8ea" ${ink(4)}/>
    <circle cx="50" cy="62" r="15" fill="#ffc531" ${ink(3)}/>
    <path d="M42 56 q4 -5 9 -4" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  toaster: () => `<path d="M14 44 q-6 -22 16 -22 h40 q22 0 16 22 v34 q0 8 -8 8 h-56 q-8 0 -8 -8z" fill="#e5a55a" ${ink(4)}/>
    <path d="M22 44 q-3 -14 10 -14 h36 q13 0 10 14 v30 q0 4 -4 4 h-48 q-4 0 -4 -4z" fill="#f7cf8a"/>
    <path d="M34 42 v30 M50 42 v30 M66 42 v30" stroke="#e5a55a" stroke-width="3" stroke-linecap="round"/>`,
  fryer: () => `<path d="M18 52 q-6 -18 12 -26 q12 -10 30 -4 q22 0 24 22 q2 24 -18 32 q-20 8 -38 -2 q-10 -8 -10 -22z" fill="#c99556" ${ink(4)}/>
    <g fill="#9c6a33"><circle cx="38" cy="44" r="3"/><circle cx="60" cy="38" r="3"/><circle cx="54" cy="62" r="3"/><circle cx="72" cy="56" r="2.5"/><circle cx="34" cy="64" r="2.5"/></g>
    <path d="M30 36 q8 -8 18 -6" fill="none" stroke="#e6bd85" stroke-width="5" stroke-linecap="round"/>`,
  oven: () => `<path d="M24 34 l8 -18 h36 l8 18 l-4 52 h-44z" fill="#fff8ea" ${ink(4)}/>
    <path d="M24 34 h52" stroke="${INK}" stroke-width="4"/>
    <path d="M32 16 q18 10 36 0" fill="none" ${ink(3)}/>
    <circle cx="50" cy="62" r="13" fill="#e8ae68" ${ink(3)}/>
    <g fill="#6b3a1e"><circle cx="46" cy="58" r="2.5"/><circle cx="55" cy="63" r="2.5"/><circle cx="48" cy="68" r="2"/></g>`,
};

export function ingredientIcon(stationId, extra = '') {
  return svg('0 0 100 100', (INGREDIENTS[stationId] || INGREDIENTS.toaster)(), extra);
}
