// Kitchen props (fridge, sink, juice, spills), pets, wall decorations and the
// small picture-icons used on buttons. No words anywhere a child plays.

import { C, INK, ink, svg, star, coin, heart } from './common.js';

// ------------------------------------------------------------------ fridge

export function fridgeSvg(open = false, extra = '') {
  const inside = open ? `
    <rect x="22" y="118" width="148" height="194" rx="10" fill="#f2fbff" ${ink(4)}/>
    <path d="M22 180 h148 M22 244 h148" ${ink(4)}/>
    <g ${ink(3)}>
      <path d="M38 180 v-38 l8 -10 h14 l8 10 v38z" fill="#fff"/><rect x="38" y="156" width="30" height="12" fill="${C.blue}"/>
      <circle cx="98" cy="164" r="14" fill="${C.red}"/><path d="M98 150 q4 -8 10 -6" fill="none"/>
      <rect x="126" y="146" width="28" height="34" rx="6" fill="${C.yellow}"/>
      <ellipse cx="52" cy="232" rx="12" ry="14" fill="#fff8ea"/><ellipse cx="78" cy="232" rx="12" ry="14" fill="#fff8ea"/>
      <path d="M112 244 q0 -30 22 -30 q22 0 22 30z" fill="${C.green}"/>
      <rect x="40" y="268" width="44" height="34" rx="6" fill="${C.orange}"/><rect x="100" y="262" width="26" height="40" rx="6" fill="${C.purple}"/>
      <circle cx="148" cy="288" r="14" fill="#ffd24a"/>
    </g>
    <path d="M22 118 l-16 -10 v214 l16 -10z" fill="#9fdcd2" ${ink(4)}/>` : `
    <rect x="150" y="136" width="12" height="76" rx="6" fill="${C.steel}" ${ink(3.5)}/>
    <path d="M60 196 l5 12 h12 l-10 8 l4 13 l-11 -8 l-11 8 l4 -13 l-10 -8 h12z" fill="${C.yellow}" ${ink(3)}/>
    ${heart(104, 168, 11)}
    <rect x="52" y="246" width="50" height="42" rx="4" fill="#fff" ${ink(3)} transform="rotate(-5 77 267)"/>
    <path d="M62 262 q8 -8 14 0 t14 0 M62 274 h24" fill="none" stroke="${C.blue}" stroke-width="3.5" stroke-linecap="round" transform="rotate(-5 77 267)"/>`;
  return svg('0 0 190 330', `
    <ellipse cx="95" cy="322" rx="88" ry="8" fill="#000" opacity=".12"/>
    <rect x="10" y="8" width="170" height="310" rx="24" fill="#bfeee4" ${ink(5)}/>
    <path d="M10 110 h170" ${ink(5)}/>
    <rect x="150" y="38" width="12" height="46" rx="6" fill="${C.steel}" ${ink(3.5)}/>
    <path d="M30 30 q4 -10 16 -10" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>
    <circle cx="46" cy="62" r="12" fill="${C.pink}" ${ink(3)}/><circle cx="46" cy="62" r="4" fill="#fff"/>
    ${inside}`, extra);
}

// -------------------------------------------------------------------- sink

function plateStack(x, baseY, n, dirty) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const y = baseY - i * 9;
    const dx = dirty ? (i % 2 ? 4 : -4) : 0;
    out += `<ellipse cx="${x + dx}" cy="${y}" rx="38" ry="10" fill="#fff" ${ink(3.5)}/>
      <ellipse cx="${x + dx}" cy="${y - 1}" rx="25" ry="5.5" fill="${dirty ? '#d9b98a' : '#e3ebf2'}"/>`;
    if (dirty) out += `<circle cx="${x + dx - 10}" cy="${y - 1}" r="4" fill="#9a5b2a"/><circle cx="${x + dx + 8}" cy="${y}" r="3" fill="${C.red}"/>`;
  }
  if (!dirty && n > 0) {
    const y = baseY - (n - 1) * 9;
    out += `<path class="twinkle" d="M${x + 30} ${y - 18} l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" fill="#fff" ${ink(2)}/>`;
  }
  return out;
}

export function sinkSvg({ dirty = 0, clean = 0, washing = false } = {}, extra = '') {
  return svg('0 0 210 270', `
    <ellipse cx="105" cy="262" rx="98" ry="8" fill="#000" opacity=".12"/>
    <rect x="96" y="70" width="110" height="12" rx="5" fill="${C.wood}" ${ink(4)}/>
    <path d="M110 82 l-8 16 M192 82 l8 16" ${ink(4)}/>
    <g class="clean-stack">${plateStack(151, 62, Math.min(clean, 6), false)}</g>
    <rect x="12" y="150" width="186" height="112" rx="12" fill="#f8e2b8" ${ink(5)}/>
    <rect x="26" y="172" width="74" height="76" rx="8" fill="#f1d199" ${ink(3.5)}/><rect x="110" y="172" width="74" height="76" rx="8" fill="#f1d199" ${ink(3.5)}/>
    <circle cx="90" cy="210" r="5" fill="${C.woodDark}" ${ink(2.5)}/><circle cx="120" cy="210" r="5" fill="${C.woodDark}" ${ink(2.5)}/>
    <path d="M150 132 v-34 q0 -22 -22 -22 q-20 0 -20 18" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/>
    <path d="M150 132 v-34 q0 -22 -22 -22 q-20 0 -20 18" fill="none" stroke="${C.steel}" stroke-width="9" stroke-linecap="round"/>
    <rect x="164" y="112" width="22" height="12" rx="5" fill="${C.red}" ${ink(3)}/>
    ${washing ? `<rect class="water" x="103" y="96" width="10" height="42" rx="5" fill="#7cc8ff" ${ink(2.5)}/>` : ''}
    <rect x="2" y="130" width="206" height="26" rx="10" fill="${C.steel}" ${ink(5)}/>
    <path d="M62 128 h96 l-4 12 h-88z" fill="#8b98a5" ${ink(3)}/>
    <g class="dirty-stack">${plateStack(42, 126, Math.min(dirty, 6), true)}</g>
    ${washing ? `<g class="suds" fill="#fff" ${ink(2.5)}><circle cx="86" cy="128" r="10"/><circle cx="104" cy="122" r="12"/><circle cx="124" cy="127" r="10"/><circle cx="140" cy="124" r="8"/><circle cx="114" cy="110" r="6"/></g>` : ''}`, extra);
}

// ------------------------------------------------------------------- juice

export function jugSvg(extra = '') {
  return svg('0 0 100 120', `
    <ellipse cx="46" cy="112" rx="36" ry="6" fill="#000" opacity=".12"/>
    <path d="M70 40 q26 0 24 26 q-2 22 -26 22" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
    <path d="M70 40 q26 0 24 26 q-2 22 -26 22" fill="none" stroke="#dff3ff" stroke-width="6" stroke-linecap="round"/>
    <path d="M14 14 q-8 -8 4 -8 h56 l-4 96 q-24 10 -48 0z" fill="#e9f7ff" ${ink(4.5)}/>
    <path d="M20 46 h51 l-3 54 q-22 8 -44 0z" fill="${C.orange}"/>
    <path d="M20 46 q25 8 51 0" fill="none" stroke="#ffc27a" stroke-width="5"/>
    <circle cx="36" cy="66" r="6" fill="#ffc27a"/><circle cx="54" cy="82" r="5" fill="#ffc27a"/>
    <path d="M26 20 l2 70" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`, extra);
}

// ------------------------------------------------------------------ spills

const SPILL_COLORS = [['#ffb347', '#ffd9a0'], ['#fdfdfd', '#ffffff'], ['#f2766b', '#ffb0a8']];

export function spillSvg(kind = 0, extra = '') {
  const [fill, hi] = SPILL_COLORS[kind % SPILL_COLORS.length];
  return svg('0 0 120 56', `
    <path d="M12 30 q-8 -14 12 -16 q8 -12 26 -6 q14 -8 26 2 q22 -4 26 10 q12 6 2 16 q-8 12 -28 8 q-14 10 -30 2 q-22 6 -30 -6 q-10 -2 -4 -10z" fill="${fill}" ${ink(4)}/>
    <path d="M30 24 q10 -8 24 -4" fill="none" stroke="${hi}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="104" cy="46" r="5" fill="${fill}" ${ink(3)}/><circle cx="10" cy="46" r="4" fill="${fill}" ${ink(3)}/>`, extra);
}

export function clothSvg(extra = '') {
  return svg('0 0 100 80', `
    <path d="M10 24 q20 -18 40 -6 q20 -14 40 0 q8 20 -2 40 q-20 14 -40 4 q-20 12 -38 -2 q-8 -18 0 -36z" fill="#7cc8ff" ${ink(4)}/>
    <path d="M24 30 q26 10 52 0 M24 46 q26 10 52 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`, extra);
}

// ------------------------------------------------------------ pointer hand

export function handSvg(extra = '') {
  return svg('0 0 100 120', `
    <path d="M38 112 l-4 -40 q-16 -4 -18 -18 q-2 -12 10 -12 v-26 q0 -12 11 -12 q11 0 11 12 v22 q22 -2 32 6 q8 8 4 28 l-6 40z" fill="#fff" ${ink(5)}/>
    <path d="M48 40 v18 M62 46 v12 M74 50 v10" ${ink(4)}/>`, extra);
}

// -------------------------------------------------------------------- pets

const PETS = {
  cat: () => `
    <path class="tail" d="M88 96 q26 -6 20 -34" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
    <path class="tail" d="M88 96 q26 -6 20 -34" fill="none" stroke="#8d97a3" stroke-width="8" stroke-linecap="round"/>
    <path d="M28 110 q-6 -44 32 -46 q38 2 32 46z" fill="#8d97a3" ${ink(4.5)}/>
    <path d="M30 42 l-2 -30 l24 14z" fill="#8d97a3" ${ink(4.5)}/><path d="M90 42 l2 -30 l-24 14z" fill="#8d97a3" ${ink(4.5)}/>
    <ellipse cx="60" cy="50" rx="34" ry="28" fill="#a3adb8" ${ink(4.5)}/>
    <g class="eyes"><ellipse cx="47" cy="48" rx="5" ry="7" fill="${C.green}" ${ink(2.5)}/><ellipse cx="73" cy="48" rx="5" ry="7" fill="${C.green}" ${ink(2.5)}/><path d="M47 43 v10 M73 43 v10" ${ink(2.5)}/></g>
    <path d="M56 58 h8 l-4 5z" fill="${C.pink}" ${ink(2)}/><path d="M60 63 q-6 6 -11 1 M60 63 q6 6 11 1" fill="none" ${ink(2.5)}/>
    <ellipse cx="46" cy="110" rx="10" ry="6" fill="#fff" ${ink(3.5)}/><ellipse cx="74" cy="110" rx="10" ry="6" fill="#fff" ${ink(3.5)}/>`,
  dog: () => `
    <path class="tail" d="M90 92 q22 -10 18 -32" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
    <path class="tail" d="M90 92 q22 -10 18 -32" fill="none" stroke="#c58a4f" stroke-width="7" stroke-linecap="round"/>
    <path d="M28 110 q-6 -44 32 -46 q38 2 32 46z" fill="#e3b77e" ${ink(4.5)}/>
    <ellipse cx="60" cy="48" rx="32" ry="28" fill="#e3b77e" ${ink(4.5)}/>
    <path d="M32 30 q-22 4 -14 40 q14 2 18 -18z" fill="#a8693a" ${ink(4.5)}/><path d="M88 30 q22 4 14 40 q-14 2 -18 -18z" fill="#a8693a" ${ink(4.5)}/>
    <ellipse cx="60" cy="60" rx="18" ry="14" fill="#fff6e6"/>
    <g class="eyes"><circle cx="48" cy="44" r="5" fill="${INK}"/><circle cx="72" cy="44" r="5" fill="${INK}"/><circle cx="46.500" cy="42.500" r="1.800" fill="#fff"/><circle cx="70.500" cy="42.500" r="1.800" fill="#fff"/></g>
    <ellipse cx="60" cy="55" rx="6" ry="4.500" fill="${INK}"/><path d="M60 60 v5 q-6 6 -10 0 M60 65 q6 6 10 0" fill="none" ${ink(2.5)}/>
    <path d="M56 68 q4 12 9 0z" fill="${C.pink}" ${ink(2)}/>
    <ellipse cx="46" cy="110" rx="10" ry="6" fill="#fff6e6" ${ink(3.5)}/><ellipse cx="74" cy="110" rx="10" ry="6" fill="#fff6e6" ${ink(3.5)}/>`,
  rabbit: () => `
    <circle class="tail" cx="94" cy="98" r="10" fill="#fff" ${ink(4)}/>
    <ellipse cx="46" cy="22" rx="10" ry="26" fill="#fff" ${ink(4.5)} transform="rotate(-8 46 22)"/><ellipse cx="74" cy="22" rx="10" ry="26" fill="#fff" ${ink(4.5)} transform="rotate(8 74 22)"/>
    <ellipse cx="46" cy="24" rx="4.500" ry="17" fill="#ffc2d1" transform="rotate(-8 46 24)"/><ellipse cx="74" cy="24" rx="4.500" ry="17" fill="#ffc2d1" transform="rotate(8 74 24)"/>
    <path d="M30 110 q-6 -42 30 -44 q36 2 30 44z" fill="#fff" ${ink(4.5)}/>
    <ellipse cx="60" cy="56" rx="30" ry="26" fill="#fff" ${ink(4.5)}/>
    <g class="eyes"><circle cx="48" cy="52" r="5" fill="${INK}"/><circle cx="72" cy="52" r="5" fill="${INK}"/></g>
    <path d="M56 62 h8 l-4 5z" fill="${C.pink}" ${ink(2)}/><rect x="56" y="68" width="8" height="8" rx="2" fill="#fff" ${ink(2)}/>
    <circle cx="40" cy="64" r="6" fill="#ff9aa8" opacity=".5"/><circle cx="80" cy="64" r="6" fill="#ff9aa8" opacity=".5"/>`,
  parrot: () => `
    <path d="M16 104 h88" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M16 104 h88" stroke="${C.wood}" stroke-width="5" stroke-linecap="round"/>
    <path class="tail" d="M52 92 l-10 26 h12 l6 -18 l6 18 h12 l-10 -26z" fill="${C.red}" ${ink(4)}/>
    <path d="M34 62 q0 -44 28 -44 q28 0 28 44 q0 36 -28 36 q-28 0 -28 -36z" fill="${C.green}" ${ink(4.5)}/>
    <path d="M38 64 q-10 24 12 30 q10 -18 -12 -30z" fill="${C.blue}" ${ink(4)}/>
    <ellipse cx="66" cy="44" rx="16" ry="14" fill="#fff8ea"/>
    <g class="eyes"><circle cx="66" cy="42" r="5" fill="${INK}"/><circle cx="64.500" cy="40.500" r="1.800" fill="#fff"/></g>
    <path d="M80 44 q20 2 14 18 q-10 6 -16 -4z" fill="${C.yellow}" ${ink(4)}/>
    <path d="M52 18 q-2 -14 8 -12 q-2 6 2 12 q4 -10 12 -6 q-6 4 -6 10z" fill="${C.red}" ${ink(3.5)}/>`,
  dragon: () => `
    <path class="tail" d="M86 100 q26 0 22 -24 l8 2 l-6 -12 l-10 8 l6 2 q2 12 -18 10z" fill="#62c370" ${ink(4)}/>
    <path d="M28 70 q-22 -22 -6 -40 q6 16 26 18z" fill="${C.orange}" ${ink(4)} class="wing"/><path d="M92 70 q22 -22 6 -40 q-6 16 -26 18z" fill="${C.orange}" ${ink(4)} class="wing"/>
    <path d="M30 110 q-6 -44 30 -46 q36 2 30 46z" fill="#62c370" ${ink(4.5)}/>
    <ellipse cx="60" cy="96" rx="16" ry="14" fill="#d9f5a8" ${ink(3)}/>
    <path d="M40 26 l-4 -16 l14 8z" fill="${C.yellow}" ${ink(3.5)}/><path d="M80 26 l4 -16 l-14 8z" fill="${C.yellow}" ${ink(3.5)}/>
    <ellipse cx="60" cy="48" rx="32" ry="26" fill="#62c370" ${ink(4.5)}/>
    <ellipse cx="60" cy="60" rx="20" ry="11" fill="#7bd985"/>
    <g class="eyes"><ellipse cx="46" cy="42" rx="7" ry="8" fill="#fff" ${ink(2.5)}/><ellipse cx="74" cy="42" rx="7" ry="8" fill="#fff" ${ink(2.5)}/><circle cx="47" cy="43" r="3.500" fill="${INK}"/><circle cx="73" cy="43" r="3.500" fill="${INK}"/></g>
    <circle cx="53" cy="58" r="2" fill="${INK}"/><circle cx="67" cy="58" r="2" fill="${INK}"/>
    <path d="M50 66 q10 6 20 0" fill="none" ${ink(2.5)}/>
    <path class="puff" d="M86 60 q10 -4 12 4 q8 0 6 8 q-10 4 -14 -4 q-6 -2 -4 -8z" fill="#fff" ${ink(2.5)} opacity=".9"/>`,
};

export function petSvg(id, extra = '') {
  return svg('0 0 120 120', `<ellipse cx="60" cy="114" rx="40" ry="5" fill="#000" opacity=".12"/>${(PETS[id] || PETS.cat)()}`, extra);
}

// ------------------------------------------------------------- decorations

export function clockSvg(extra = '') {
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ticks += `<circle cx="${(50 + Math.sin(a) * 31).toFixed(1)}" cy="${(50 - Math.cos(a) * 31).toFixed(1)}" r="${i % 3 === 0 ? 3.2 : 1.8}" fill="${INK}"/>`;
  }
  return svg('0 0 100 100', `
    <circle cx="50" cy="50" r="45" fill="${C.red}" ${ink(4.5)}/>
    <circle cx="50" cy="50" r="37" fill="#fffdf5" ${ink(3)}/>
    ${ticks}
    <path class="clock-hand" d="M50 50 V20" stroke="${C.red}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="5" fill="${INK}"/>`, extra);
}

const DECOR = {
  plant: () => svg('0 0 100 140', `
    <g ${ink(4)} fill="${C.green}">
      <path d="M50 92 q-36 -10 -34 -50 q28 8 34 50z"/><path d="M50 92 q36 -10 34 -50 q-28 8 -34 50z"/>
      <path d="M50 92 q-14 -40 0 -78 q14 38 0 78z" fill="${C.greenDark}"/>
    </g>
    <path d="M22 88 h56 l-7 44 h-42z" fill="${C.orange}" ${ink(4.5)}/>
    <rect x="18" y="82" width="64" height="14" rx="6" fill="#ffb469" ${ink(4.5)}/>`),
  picture: () => svg('0 0 110 96', `
    <path d="M55 4 l-22 14 h44z" fill="none" ${ink(3)}/>
    <rect x="6" y="16" width="98" height="76" rx="6" fill="${C.wood}" ${ink(4.5)}/>
    <rect x="16" y="26" width="78" height="56" rx="3" fill="#bfe6ff" ${ink(3)}/>
    <circle cx="76" cy="42" r="9" fill="${C.yellow}" ${ink(2.5)}/>
    <path d="M16 82 l20 -28 l14 18 l12 -12 l32 22z" fill="${C.green}" ${ink(3)}/>`),
  bunting: () => {
    const colors = [C.red, C.yellow, C.blue, C.green, C.pink, C.purple, C.orange, C.teal];
    let flags = '';
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 47;
      const sag = 14 - Math.abs(i - 5.5) * 1.2;
      const y = 8 + (14 - Math.pow((i - 5.5) / 5.5, 2) * 14);
      void sag;
      flags += `<path d="M${x} ${y.toFixed(1)} h38 l-19 34z" fill="${colors[i % colors.length]}" ${ink(3.5)}/>`;
    }
    return svg('0 0 600 70', `<path d="M4 8 q296 30 592 0" fill="none" ${ink(4)}/>${flags}`, 'preserveAspectRatio="none"');
  },
  fishbowl: () => svg('0 0 100 100', `
    <path d="M30 16 h40 q-4 10 8 18 q16 14 12 34 q-6 26 -40 26 q-34 0 -40 -26 q-4 -20 12 -34 q12 -8 8 -18z" fill="#d9f2ff" ${ink(4.5)}/>
    <path d="M14 56 q36 -10 72 0 q0 34 -36 34 q-36 0 -36 -34z" fill="#8fd4ff"/>
    <g class="fish"><path d="M40 66 q12 -12 24 0 q-12 12 -24 0z" fill="${C.orange}" ${ink(3)}/><path d="M64 66 l10 -8 v16z" fill="${C.orange}" ${ink(3)}/><circle cx="47" cy="64" r="2" fill="${INK}"/></g>
    <circle cx="68" cy="48" r="3" fill="#fff" ${ink(1.5)}/><circle cx="74" cy="38" r="2" fill="#fff" ${ink(1.5)}/>
    <path d="M26 40 q4 -10 12 -14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
  lights: () => {
    const colors = [C.yellow, C.red, C.blue, C.green, C.pink, C.orange];
    let bulbs = '';
    for (let i = 0; i < 14; i++) {
      const x = 22 + i * 43;
      const y = 6 + (18 - Math.pow((i - 6.5) / 6.5, 2) * 18);
      bulbs += `<g class="bulb l${i % 3}"><rect x="${x - 4}" y="${(y - 2).toFixed(1)}" width="8" height="8" rx="2" fill="${INK}"/>
        <ellipse cx="${x}" cy="${(y + 15).toFixed(1)}" rx="8" ry="11" fill="${colors[i % colors.length]}" ${ink(3)}/></g>`;
    }
    return svg('0 0 600 60', `<path d="M4 6 q296 36 592 0" fill="none" ${ink(3.5)}/>${bulbs}`, 'preserveAspectRatio="none"');
  },
};

export function decorSvg(id) {
  return (DECOR[id] || DECOR.plant)();
}

// ------------------------------------------------------------------- icons

const ICONS = {
  star: () => star(50, 52, 42),
  coin: () => coin(50, 50, 42),
  play: () => `<path d="M30 16 l52 34 l-52 34z" fill="#fff" ${ink(7)}/>`,
  pause: () => `<rect x="24" y="18" width="20" height="64" rx="7" fill="#fff" ${ink(6)}/><rect x="56" y="18" width="20" height="64" rx="7" fill="#fff" ${ink(6)}/>`,
  home: () => `<path d="M12 50 l38 -36 l38 36" fill="none" ${ink(9)}/><path d="M22 46 v40 h56 v-40 l-28 -26z" fill="#fff" ${ink(6)}/><rect x="42" y="58" width="16" height="28" rx="3" fill="${C.red}" ${ink(5)}/>`,
  cart: () => `<path d="M8 20 h14 l10 44 h44 l8 -30 h-58" fill="#fff" ${ink(7)}/><circle cx="38" cy="80" r="8" fill="#fff" ${ink(6)}/><circle cx="70" cy="80" r="8" fill="#fff" ${ink(6)}/>`,
  gear: () => {
    let teeth = '';
    for (let i = 0; i < 8; i++) teeth += `<rect x="43" y="6" width="14" height="20" rx="4" fill="#fff" ${ink(5)} transform="rotate(${i * 45} 50 50)"/>`;
    return `${teeth}<circle cx="50" cy="50" r="30" fill="#fff" ${ink(6)}/><circle cx="50" cy="50" r="11" fill="${C.steelDark}" ${ink(5)}/>`;
  },
  lock: () => `<path d="M30 46 v-14 q0 -20 20 -20 q20 0 20 20 v14" fill="none" ${ink(9)}/><rect x="20" y="44" width="60" height="46" rx="10" fill="${C.yellow}" ${ink(6)}/><circle cx="50" cy="64" r="7" fill="${INK}"/><path d="M50 66 v12" ${ink(6)}/>`,
  back: () => `<path d="M58 16 l-34 34 l34 34" fill="none" ${ink(18)}/><path d="M58 16 l-34 34 l34 34" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  check: () => `<path d="M18 54 l22 22 l44 -50" fill="none" ${ink(20)}/><path d="M18 54 l22 22 l44 -50" fill="none" stroke="${C.green}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: () => `<path d="M50 16 v68 M16 50 h68" fill="none" ${ink(22)}/><path d="M50 16 v68 M16 50 h68" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>`,
  close: () => `<path d="M22 22 l56 56 M78 22 l-56 56" fill="none" ${ink(20)}/><path d="M22 22 l56 56 M78 22 l-56 56" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`,
  soundOn: () => `<path d="M12 38 h18 l24 -20 v64 l-24 -20 h-18z" fill="#fff" ${ink(6)}/><path d="M66 34 q12 16 0 32 M78 22 q22 28 0 56" fill="none" ${ink(7)}/>`,
  soundOff: () => `<path d="M12 38 h18 l24 -20 v64 l-24 -20 h-18z" fill="#fff" ${ink(6)}/><path d="M66 36 l24 28 M90 36 l-24 28" fill="none" ${ink(8)}/>`,
  music: () => `<path d="M36 74 v-52 l44 -10 v52" fill="none" ${ink(7)}/><ellipse cx="26" cy="76" rx="13" ry="10" fill="#fff" ${ink(6)}/><ellipse cx="70" cy="66" rx="13" ry="10" fill="#fff" ${ink(6)}/>`,
  full: () => `<path d="M14 36 v-22 h22 M64 14 h22 v22 M86 64 v22 h-22 M36 86 h-22 v-22" fill="none" ${ink(16)}/><path d="M14 36 v-22 h22 M64 14 h22 v22 M86 64 v22 h-22 M36 86 h-22 v-22" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  moon: () => `<path d="M64 12 q-40 6 -40 40 q0 36 40 38 q-24 -14 -24 -38 q0 -26 24 -40z" fill="#ffe27a" ${ink(6)}/>${star(72, 34, 9, '#fff', 2.5)}`,
  sun: () => {
    let rays = '';
    for (let i = 0; i < 8; i++) rays += `<path d="M50 6 v12" ${ink(7)} transform="rotate(${i * 45} 50 50)"/>`;
    return `${rays}<circle cx="50" cy="50" r="24" fill="${C.yellow}" ${ink(6)}/>`;
  },
  hat: () => `<path d="M26 60 q-22 -10 -10 -32 q4 -22 28 -16 q8 -10 22 0 q22 -6 26 16 q12 22 -10 32z" fill="#fff" ${ink(6)}/><rect x="24" y="56" width="52" height="24" rx="6" fill="#fff" ${ink(6)}/>`,
  paw: () => `<ellipse cx="50" cy="64" rx="22" ry="18" fill="#fff" ${ink(6)}/><circle cx="22" cy="40" r="10" fill="#fff" ${ink(5)}/><circle cx="42" cy="24" r="10" fill="#fff" ${ink(5)}/><circle cx="62" cy="24" r="10" fill="#fff" ${ink(5)}/><circle cx="80" cy="40" r="10" fill="#fff" ${ink(5)}/>`,
  brush: () => `<path d="M60 12 l28 28 l-34 34 l-28 -28z" fill="${C.wood}" ${ink(6)}/><path d="M26 46 l28 28 q-12 20 -42 14 q10 -14 14 -42z" fill="${C.blue}" ${ink(6)}/>`,
  frame: () => `<rect x="12" y="18" width="76" height="64" rx="6" fill="${C.wood}" ${ink(6)}/><rect x="24" y="30" width="52" height="40" rx="3" fill="#bfe6ff" ${ink(4)}/><path d="M24 70 l16 -20 l12 12 l8 -8 l16 16z" fill="${C.green}" ${ink(3.5)}/>`,
  fork: () => `<path d="M30 12 v26 q0 10 8 12 v38" fill="none" ${ink(8)}/><path d="M22 12 v22 M38 12 v22" ${ink(6)}/><path d="M68 12 q-12 10 -10 34 h10 v42" fill="none" ${ink(8)}/>`,
  trash: () => `<path d="M24 30 h52 l-6 58 h-40z" fill="#fff" ${ink(6)}/><path d="M16 28 h68 M40 28 v-10 h20 v10" fill="none" ${ink(7)}/><path d="M40 44 v30 M60 44 v30" ${ink(5)}/>`,
  hourglass: () => `<path d="M26 12 h48 M26 88 h48" ${ink(8)}/><path d="M30 14 h40 q0 26 -20 36 q20 10 20 36 h-40 q0 -26 20 -36 q-20 -10 -20 -36z" fill="#fff" ${ink(6)}/><path d="M38 80 q12 -18 24 0z" fill="${C.yellow}" ${ink(3)}/>`,
};

export function icon(name, extra = '') {
  return svg('0 0 100 100', (ICONS[name] || ICONS.star)(), extra);
}

export { star, coin };
