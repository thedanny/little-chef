// Cooking stations, drawn in a 240×220 box. Each drawing takes a small visual
// state: { recipeId, step, mode } where mode is idle | cook | quick | burnt.
// Animated bits carry classes (flame, bub, wisp, spark) styled in CSS.

import { C, INK, ink, svg } from './common.js';

const BURNT = '#2c2522';

const wisps = (xs, y) => xs.map((x, i) => `<path class="wisp w${i % 3}" d="M${x} ${y} q-8 -9 0 -18 q8 -9 0 -18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>`).join('');

const flames = (xs, y) => xs.map((x, i) => `<g class="flame f${i % 3}">
    <path d="M${x} ${y} q-9 -8 0 -22 q9 14 0 22z" fill="${C.orange}" ${ink(2.5)}/>
    <path d="M${x} ${y - 1} q-4 -5 0 -12 q4 7 0 12z" fill="${C.yellow}"/>
  </g>`).join('');

const bubbles = (pts, fill = '#fff') => pts.map(([x, y, r], i) => `<circle class="bub b${i % 4}" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="2" opacity=".9"/>`).join('');

// ------------------------------------------------------------------ stove

function stove({ recipeId, step, mode }) {
  const cooking = mode === 'cook';
  let contents = `<ellipse cx="120" cy="56" rx="60" ry="12" fill="#2b4f78"/>`;
  let above = '';
  if (mode !== 'idle') {
    if (mode === 'burnt') {
      contents = `<ellipse cx="120" cy="56" rx="60" ry="12" fill="${BURNT}"/>
        <path d="M78 56 q10 -10 22 -2 q12 -12 26 0 q14 -8 26 2" fill="#191513"/>`;
    } else if (recipeId === 'soup') {
      contents = `<ellipse cx="120" cy="56" rx="60" ry="12" fill="#ff9d2e"/>
        <circle cx="96" cy="55" r="6" fill="#ff6b2b" ${ink(2)}/><circle cx="140" cy="58" r="6" fill="#ff6b2b" ${ink(2)}/>
        <circle cx="118" cy="52" r="4" fill="${C.green}" ${ink(2)}/><circle cx="160" cy="54" r="4" fill="${C.green}" ${ink(2)}/><circle cx="80" cy="57" r="3.5" fill="${C.green}" ${ink(2)}/>
        ${step >= 1 ? `<path d="M100 60 q20 6 40 -2 q8 -6 -6 -8" fill="none" stroke="#ffd08a" stroke-width="4" stroke-linecap="round"/>` : ''}
        ${cooking ? bubbles([[90, 50, 5], [126, 60, 4], [150, 50, 5], [108, 62, 3]], '#ffc27a') : ''}`;
    } else if (mode === 'quick') {
      // Drained pasta, waiting for cheese.
      contents = `<ellipse cx="120" cy="56" rx="60" ry="12" fill="#ffd864"/>`;
      above = `<path d="M64 54 q56 -40 112 0z" fill="#ffd864" ${ink(4)}/>
        <g fill="none" stroke="#f39c12" stroke-width="7" stroke-linecap="round">
          <path d="M82 48 q8 -11 17 -2"/><path d="M106 38 q9 -10 18 0"/><path d="M134 42 q9 -10 18 1"/><path d="M96 54 q9 -8 17 1"/><path d="M124 52 q9 -8 17 1"/>
        </g>`;
    } else {
      contents = `<ellipse cx="120" cy="56" rx="60" ry="12" fill="#bfe6ff"/>
        <g fill="none" stroke="#f3ad22" stroke-width="7" stroke-linecap="round">
          <path d="M78 56 q8 -9 16 -1"/><path d="M104 52 q8 -9 16 0"/><path d="M132 56 q8 -9 16 0"/><path d="M152 52 q7 -7 13 0"/>
        </g>
        ${cooking ? bubbles([[92, 50, 5], [122, 60, 4], [146, 49, 5], [164, 58, 3]]) : ''}`;
    }
  }
  return `
    <rect x="20" y="124" width="200" height="90" rx="14" fill="${C.red}" ${ink(5)}/>
    <rect x="34" y="158" width="172" height="44" rx="8" fill="${C.redDark}" ${ink(3)}/>
    <rect x="62" y="166" width="116" height="9" rx="4.5" fill="${C.steel}" ${ink(3)}/>
    <rect x="52" y="182" width="136" height="14" rx="5" fill="#7a221b" opacity=".7"/>
    <rect x="10" y="108" width="220" height="24" rx="9" fill="${C.char}" ${ink(5)}/>
    <g ${ink(3)} fill="${C.cream}"><circle cx="58" cy="145" r="8"/><circle cx="120" cy="145" r="8"/><circle cx="182" cy="145" r="8"/></g>
    <g class="food">
      <rect x="26" y="58" width="26" height="14" rx="6" fill="${C.blueDark}" ${ink(4)}/>
      <rect x="188" y="58" width="26" height="14" rx="6" fill="${C.blueDark}" ${ink(4)}/>
      <path d="M50 54 h140 l-8 50 q-62 12 -124 0z" fill="${C.blue}" ${ink(5)}/>
      <path d="M62 84 q58 12 116 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>
      <ellipse cx="120" cy="54" rx="70" ry="16" fill="${C.blueDark}" ${ink(5)}/>
      ${contents}
      ${above}
    </g>
    ${cooking ? flames([70, 95, 120, 145, 170], 116) : ''}
    ${cooking ? wisps([96, 122, 148], 36) : ''}
    ${mode === 'quick' ? wisps([108, 136], 22) : ''}`;
}

// ---------------------------------------------------------------- griddle

function griddle({ recipeId, step, mode }) {
  const cooking = mode === 'cook';
  let food = '';
  if (mode !== 'idle') {
    const burnt = mode === 'burnt';
    if (recipeId === 'grilled') {
      const flipped = step >= 1;
      const top = burnt ? BURNT : flipped ? '#e9a04b' : '#f8e6bd';
      const side = burnt ? '#191513' : flipped ? '#c97f2e' : '#e4bf85';
      food = `<path d="M62 98 l8 14 h100 l8 -14z" fill="${side}" ${ink(4)}/>
        ${burnt ? '' : `<path d="M66 104 q10 12 18 2 q8 10 16 0 q10 12 20 0 q10 10 18 0 q8 8 14 -1 l2 -3 h-88z" fill="${C.yellow}" ${ink(3)}/>`}
        <path d="M76 66 h88 l14 32 h-116z" fill="${top}" ${ink(4)}/>
        ${flipped && !burnt ? `<g stroke="#b56a25" stroke-width="4" stroke-linecap="round"><path d="M86 74 l-8 18"/><path d="M106 72 l-6 22"/><path d="M128 72 l4 22"/><path d="M150 74 l10 18"/></g>` : ''}`;
    } else {
      const flipped = step >= 1;
      const top = burnt ? BURNT : flipped ? '#eaa04a' : '#f8e7b6';
      const side = burnt ? '#191513' : flipped ? '#c97f2e' : '#e6c98e';
      food = `<path d="M60 86 q0 -20 60 -20 q60 0 60 20 v8 q0 20 -60 20 q-60 0 -60 -20z" fill="${side}" ${ink(4)}/>
        <ellipse cx="120" cy="86" rx="60" ry="20" fill="${top}" ${ink(4)}/>
        ${flipped && !burnt ? `<ellipse cx="120" cy="86" rx="46" ry="14" fill="none" stroke="#d48a35" stroke-width="5"/><ellipse cx="112" cy="82" rx="18" ry="5" fill="#f4bd6c" opacity=".8"/>` : ''}
        ${!flipped && !burnt ? `<g fill="none" stroke="#d9b671" stroke-width="2.5"><circle cx="98" cy="82" r="4"/><circle cx="126" cy="90" r="5"/><circle cx="146" cy="80" r="3.5"/><circle cx="112" cy="94" r="3"/></g>` : ''}
        ${burnt ? `<path d="M88 84 q10 -8 20 0 q10 -8 22 2 q10 -6 20 0" fill="none" stroke="#191513" stroke-width="5" stroke-linecap="round"/>` : ''}`;
    }
  }
  const sparks = cooking ? `<g class="sparks" stroke="#ffe27a" stroke-width="4" stroke-linecap="round">
      <path class="spark s0" d="M44 84 l-10 -8"/><path class="spark s1" d="M196 84 l10 -8"/><path class="spark s2" d="M52 104 l-12 2"/><path class="spark s0" d="M188 104 l12 2"/><path class="spark s1" d="M120 56 v-10"/>
    </g>` : '';
  return `
    <rect x="18" y="132" width="204" height="80" rx="14" fill="${C.steel}" ${ink(5)}/>
    <rect x="32" y="150" width="176" height="48" rx="8" fill="${C.steelDark}" ${ink(3)}/>
    <g ${ink(3)}><circle cx="66" cy="174" r="13" fill="${C.red}"/><circle cx="174" cy="174" r="13" fill="${C.red}"/>
      <path d="M66 174 v-9 M174 174 v-9" stroke-width="3"/></g>
    <circle cx="120" cy="174" r="8" fill="${cooking ? C.orange : '#6d7780'}" ${ink(3)} class="${cooking ? 'lamp' : ''}"/>
    <path d="M8 98 q0 -40 112 -40 q112 0 112 40 v14 q0 30 -112 30 q-112 0 -112 -30z" fill="#2c2c32" ${ink(5)}/>
    <ellipse cx="120" cy="96" rx="112" ry="38" fill="#4c4c55" ${ink(5)}/>
    <ellipse cx="120" cy="96" rx="98" ry="30" fill="none" stroke="#5e5e68" stroke-width="4"/>
    <g class="food">${food}</g>
    ${sparks}
    ${cooking ? wisps([92, 148], 58) : ''}`;
}

// ---------------------------------------------------------------- toaster

function toaster({ mode }) {
  const cooking = mode === 'cook';
  const up = mode === 'quick' || mode === 'burnt';
  const fill = mode === 'burnt' ? BURNT : up ? '#f1b869' : '#fbe9c4';
  const crust = mode === 'burnt' ? '#191513' : up ? '#b9742c' : '#d9a55e';
  const slice = (x, y) => `<path d="M${x} ${y + 60} v-40 q-8 -4 -5 -13 q4 -8 14 -6 q11 -6 22 0 q10 -2 14 6 q3 9 -5 13 v40z" fill="${fill}" stroke="${crust}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M${x} ${y + 60} v-40 q-8 -4 -5 -13 q4 -8 14 -6 q11 -6 22 0 q10 -2 14 6 q3 9 -5 13 v40z" fill="none" ${ink(3)}/>`;
  const y = up ? 8 : 44;
  const slices = mode === 'idle' ? '' : `<g class="food">${slice(64, y)}${slice(136, y)}</g>`;
  const leverY = cooking ? 150 : 104;
  return `
    <rect x="42" y="58" width="156" height="26" rx="12" fill="${C.redDark}" ${ink(5)}/>
    <rect x="58" y="62" width="52" height="12" rx="6" fill="${cooking ? '#ff8a2a' : '#2a2224'}" class="${cooking ? 'lamp' : ''}"/>
    <rect x="130" y="62" width="52" height="12" rx="6" fill="${cooking ? '#ff8a2a' : '#2a2224'}" class="${cooking ? 'lamp' : ''}"/>
    ${slices}
    <path d="M30 108 q0 -38 38 -38 h104 q38 0 38 38 v74 q0 18 -18 18 h-144 q-18 0 -18 -18z" fill="${C.red}" ${ink(5)}/>
    <path d="M46 104 q2 -20 24 -22" fill="none" stroke="#ff9d8f" stroke-width="7" stroke-linecap="round"/>
    <rect x="44" y="200" width="24" height="12" rx="5" fill="${C.char}" ${ink(4)}/><rect x="172" y="200" width="24" height="12" rx="5" fill="${C.char}" ${ink(4)}/>
    <circle cx="120" cy="150" r="20" fill="${C.cream}" ${ink(4)}/>
    <path d="M120 150 l8 -12" ${ink(4)}/>
    <circle cx="76" cy="176" r="5" fill="${cooking ? C.orange : '#8a2a22'}" ${ink(2.5)}/>
    <rect x="207" y="96" width="8" height="78" rx="4" fill="#8a2a22" ${ink(3)}/>
    <rect x="200" y="${leverY}" width="30" height="16" rx="7" fill="${C.char}" ${ink(4)} class="lever"/>
    ${up && mode !== 'burnt' ? wisps([88, 160], 6) : ''}`;
}

// ------------------------------------------------------------------ fryer

function fryer({ mode }) {
  const cooking = mode === 'cook';
  const lifted = mode !== 'cook';
  const loaded = mode === 'quick' || mode === 'burnt';
  const fry = mode === 'burnt' ? BURNT : '#ffd24a';
  const basketY = lifted ? 0 : 40;
  const friesArt = loaded ? `<g fill="${fry}" ${ink(2.5)}>
      <rect x="82" y="8" width="10" height="34" rx="3" transform="rotate(-12 87 25)"/>
      <rect x="98" y="4" width="10" height="38" rx="3" transform="rotate(-4 103 23)"/>
      <rect x="114" y="6" width="10" height="36" rx="3" transform="rotate(5 119 24)"/>
      <rect x="130" y="4" width="10" height="38" rx="3" transform="rotate(-6 135 23)"/>
      <rect x="146" y="8" width="10" height="34" rx="3" transform="rotate(12 151 25)"/>
    </g>` : '';
  const basket = `<g class="food" transform="translate(0 ${basketY})">
      ${friesArt}
      <path d="M68 30 h104 l-8 46 h-88z" fill="${C.steel}" fill-opacity=".85" ${ink(4)}/>
      <g stroke="${INK}" stroke-width="2.5" opacity=".8"><path d="M71 44 h98"/><path d="M73 58 h94"/><path d="M92 30 l3 46"/><path d="M120 30 v46"/><path d="M148 30 l-3 46"/></g>
      <path d="M172 34 q26 -6 36 -26" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <path d="M172 34 q26 -6 36 -26" fill="none" stroke="${C.red}" stroke-width="6" stroke-linecap="round"/>
    </g>`;
  const oil = `<path d="M36 100 q0 -18 84 -18 q84 0 84 18 q0 18 -84 18 q-84 0 -84 -18z" fill="${mode === 'burnt' ? '#b9831d' : '#f5b92e'}" ${ink(5)}/>
    <ellipse cx="104" cy="96" rx="34" ry="6" fill="#ffd772" opacity=".7"/>`;
  return `
    <rect x="22" y="98" width="196" height="114" rx="14" fill="${C.steel}" ${ink(5)}/>
    <rect x="38" y="140" width="164" height="58" rx="8" fill="${C.steelDark}" ${ink(3)}/>
    <circle cx="80" cy="169" r="15" fill="${C.cream}" ${ink(4)}/><path d="M80 169 l9 -8" ${ink(4)}/>
    <circle cx="150" cy="169" r="9" fill="${cooking ? C.orange : '#6d7780'}" ${ink(3)} class="${cooking ? 'lamp' : ''}"/>
    <circle cx="176" cy="169" r="9" fill="${cooking ? C.green : '#6d7780'}" ${ink(3)}/>
    ${lifted ? oil + basket : basket + oil}
    ${cooking ? bubbles([[70, 98, 6], [100, 104, 5], [136, 96, 6], [166, 102, 5], [118, 92, 4]], '#ffe9a8') : ''}
    ${cooking ? wisps([90, 150], 70) : ''}
    ${mode === 'quick' ? wisps([104, 136], 0) : ''}`;
}

// ------------------------------------------------------------------- oven

function oven({ mode }) {
  const cooking = mode === 'cook';
  const burntIn = mode === 'burnt';
  const out = mode === 'quick';
  const cookie = (x, y, fill) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="7" fill="${fill}" ${ink(3)}/>
    ${fill === BURNT ? '' : `<circle cx="${x - 5}" cy="${y - 1}" r="2" fill="#6b3a1e"/><circle cx="${x + 5}" cy="${y + 1}" r="2" fill="#6b3a1e"/>`}`;
  const inside = cooking || burntIn ? `<g class="food">
      <rect x="62" y="150" width="116" height="8" rx="3" fill="${C.steelDark}" ${ink(3)}/>
      ${cookie(84, 144, burntIn ? BURNT : '#f3ddab')}${cookie(120, 144, burntIn ? BURNT : '#f3ddab')}${cookie(156, 144, burntIn ? BURNT : '#f3ddab')}
    </g>` : '';
  const onTop = out ? `<g class="food">
      <rect x="40" y="26" width="160" height="14" rx="5" fill="${C.steel}" ${ink(4)}/>
      ${cookie(66, 22, '#e2a55b')}${cookie(102, 22, '#e2a55b')}${cookie(138, 22, '#e2a55b')}${cookie(174, 22, '#e2a55b')}
    </g>${wisps([84, 156], 8)}` : '';
  const glass = cooking ? '#ffb347' : burntIn ? '#6b2f1d' : '#2c3b46';
  return `
    <rect x="22" y="40" width="196" height="172" rx="14" fill="${C.teal}" ${ink(5)}/>
    <path d="M22 78 h196" ${ink(4)}/>
    <g ${ink(3)} fill="${C.cream}"><circle cx="58" cy="59" r="10"/><circle cx="96" cy="59" r="10"/></g>
    <rect x="130" y="50" width="64" height="18" rx="6" fill="#20303a" ${ink(3)}/>
    <circle cx="144" cy="59" r="4" fill="${cooking ? C.orange : '#51616b'}" class="${cooking ? 'lamp' : ''}"/>
    <circle cx="162" cy="59" r="4" fill="${cooking ? C.green : '#51616b'}"/>
    <rect x="38" y="88" width="164" height="112" rx="10" fill="#2f978f" ${ink(4)}/>
    <rect x="54" y="112" width="132" height="62" rx="8" fill="${glass}" ${ink(4)} class="${cooking ? 'lamp' : ''}"/>
    ${inside}
    <path d="M62 120 l16 0 M62 128 l8 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>
    <rect x="60" y="94" width="120" height="10" rx="5" fill="${C.steel}" ${ink(3)}/>
    <rect x="40" y="206" width="24" height="10" rx="4" fill="${C.char}" ${ink(3)}/><rect x="176" y="206" width="24" height="10" rx="4" fill="${C.char}" ${ink(3)}/>
    ${onTop}`;
}

const DRAW = { stove, griddle, toaster, fryer, oven };

export function stationInner(id, state = { mode: 'idle', step: 0, recipeId: null }) {
  return (DRAW[id] || toaster)(state);
}

export function stationSvg(id, state, extra = '') {
  return svg('0 0 240 220', stationInner(id, state), extra);
}

/** Collapse an engine station into the handful of things the drawing depends on. */
export function visualState(st) {
  const mode = st.phase === 'idle' ? 'idle'
    : st.phase === 'burnt' ? 'burnt'
      : st.phase === 'quick' ? 'quick' : 'cook';
  return { recipeId: st.recipeId, step: st.step, mode };
}

export function visualKey(st) {
  const v = visualState(st);
  return `${v.recipeId}|${v.step}|${v.mode}`;
}
