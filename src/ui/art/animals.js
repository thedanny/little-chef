// Animal characters: the customers, the profile avatars and the chef (the
// player's own animal wearing a chef outfit). Drawn in a 200-wide box whose
// top is at y = -40 to leave room for ears and hats.
//
// Faces carry all the emotional feedback in the game, so expressions matter:
// idle, wave, happy, ok, grumpy, sad, eating, thirsty, look.

import { C, INK, ink, svg, seeded } from './common.js';

export const SPECIES = {
  fox: { fur: '#f28b3a', inner: '#fff1dd', ears: 'pointy', earIn: '#4a2b17', cheeks: true, nose: INK },
  bear: { fur: '#b97a43', inner: '#ecd0a6', ears: 'round', muzzle: true, nose: INK },
  bunny: { fur: '#f6f1ea', inner: '#ffc2d1', ears: 'long', nose: '#ff8fb1', teeth: true },
  cat: { fur: '#f5c063', inner: '#ffd9e0', ears: 'pointy', earIn: '#ffb3c4', nose: '#ff8fb1', whiskers: true, stripes: '#d99a35' },
  frog: { fur: '#7dcf5a', inner: '#d6f5b5', ears: 'frog' },
  panda: { fur: '#ffffff', inner: '#ffffff', ears: 'round', earFill: '#3a3a40', patches: true, nose: '#3a3a40' },
  pig: { fur: '#ffb6c4', inner: '#ff93a8', ears: 'floppy', snout: true },
  owl: { fur: '#a9794f', inner: '#f5e3c6', ears: 'tuft', beak: true, discs: true },
  koala: { fur: '#aeb7c2', inner: '#f4f6f8', ears: 'big', bigNose: true },
  dog: { fur: '#eccb97', inner: '#fff6e6', ears: 'droop', earFill: '#b97a43', muzzle: true, nose: INK, spot: '#b97a43' },
};

export const SPECIES_IDS = Object.keys(SPECIES);
const SHIRTS = ['#4d9de0', '#ef5b4c', '#6cc35b', '#9b6fd6', '#ff9a3d', '#3fb8af', '#ff8fb1', '#f2c230'];

function ears(sp, low = false, hatted = false) {
  const f = sp.earFill || sp.fur;
  if (low) return '';
  if (hatted && sp.ears === 'long') {
    // Under a hat, long ears flop down the sides (a lop-eared bunny) so they stay visible.
    return `<path d="M46 58 q-40 -4 -34 66 q22 14 36 -22z" fill="${f}" ${ink(5)}/><path d="M154 58 q40 -4 34 66 q-22 14 -36 -22z" fill="${f}" ${ink(5)}/>
      <path d="M36 72 q-16 14 -12 42 q10 2 16 -14z" fill="${sp.inner}"/><path d="M164 72 q16 14 12 42 q-10 2 -16 -14z" fill="${sp.inner}"/>`;
  }
  switch (sp.ears) {
    case 'pointy':
      return `<path d="M44 78 l-6 -60 l48 28z" fill="${f}" ${ink(5)}/><path d="M156 78 l6 -60 l-48 28z" fill="${f}" ${ink(5)}/>
        <path d="M50 62 l-3 -28 l24 16z" fill="${sp.earIn}"/><path d="M150 62 l3 -28 l-24 16z" fill="${sp.earIn}"/>`;
    case 'round':
      return `<circle cx="48" cy="50" r="22" fill="${f}" ${ink(5)}/><circle cx="152" cy="50" r="22" fill="${f}" ${ink(5)}/>
        ${sp.earFill ? '' : `<circle cx="48" cy="52" r="10" fill="${sp.inner}"/><circle cx="152" cy="52" r="10" fill="${sp.inner}"/>`}`;
    case 'big':
      return `<circle cx="38" cy="66" r="30" fill="${f}" ${ink(5)}/><circle cx="162" cy="66" r="30" fill="${f}" ${ink(5)}/>
        <circle cx="38" cy="68" r="16" fill="${sp.inner}"/><circle cx="162" cy="68" r="16" fill="${sp.inner}"/>`;
    case 'long':
      return `<ellipse cx="72" cy="20" rx="17" ry="46" fill="${f}" ${ink(5)} transform="rotate(-8 72 20)"/><ellipse cx="128" cy="20" rx="17" ry="46" fill="${f}" ${ink(5)} transform="rotate(8 128 20)"/>
        <ellipse cx="72" cy="22" rx="8" ry="32" fill="${sp.inner}" transform="rotate(-8 72 22)"/><ellipse cx="128" cy="22" rx="8" ry="32" fill="${sp.inner}" transform="rotate(8 128 22)"/>`;
    case 'floppy':
      return `<path d="M52 56 q-30 -18 -24 22 q14 6 30 -6z" fill="${sp.inner}" ${ink(5)}/><path d="M148 56 q30 -18 24 22 q-14 6 -30 -6z" fill="${sp.inner}" ${ink(5)}/>`;
    case 'droop':
      return `<path d="M50 60 q-34 2 -26 60 q20 10 30 -22z" fill="${f}" ${ink(5)}/><path d="M150 60 q34 2 26 60 q-20 10 -30 -22z" fill="${f}" ${ink(5)}/>`;
    case 'tuft':
      return `<path d="M50 62 l-8 -34 l34 16z" fill="${f}" ${ink(5)}/><path d="M150 62 l8 -34 l-34 16z" fill="${f}" ${ink(5)}/>`;
    case 'frog':
      return `<circle cx="66" cy="56" r="24" fill="${f}" ${ink(5)}/><circle cx="134" cy="56" r="24" fill="${f}" ${ink(5)}/>`;
    default:
      return '';
  }
}

function eyePair(sp, expr, low = false) {
  // `low`: a frog wearing a hat keeps its eyes on its face instead of on top.
  const frog = sp.ears === 'frog' && !low;
  const ex = frog ? [66, 134] : [76, 124];
  const ey = frog ? 54 : low ? 90 : 96;
  const white = frog || sp.discs;
  let out = '';
  if (sp.patches) {
    out += `<ellipse cx="76" cy="96" rx="18" ry="22" fill="#3a3a40" transform="rotate(18 76 96)"/><ellipse cx="124" cy="96" rx="18" ry="22" fill="#3a3a40" transform="rotate(-18 124 96)"/>`;
  }
  if (sp.discs) {
    out += `<circle cx="76" cy="96" r="25" fill="${sp.inner}" ${ink(4)}/><circle cx="124" cy="96" r="25" fill="${sp.inner}" ${ink(4)}/>`;
  }
  if (frog) {
    out += `<circle cx="66" cy="54" r="15" fill="#fff" ${ink(3)}/><circle cx="134" cy="54" r="15" fill="#fff" ${ink(3)}/>`;
  } else if (low) {
    out += `<circle cx="76" cy="90" r="17" fill="#fff" ${ink(3)}/><circle cx="124" cy="90" r="17" fill="#fff" ${ink(3)}/>`;
  }
  const pupil = sp.patches ? '#fff' : INK;
  const glint = sp.patches ? INK : '#fff';
  const dot = (x, r = 8) => `<ellipse cx="${x}" cy="${ey}" rx="${r * 0.9}" ry="${r}" fill="${pupil}"/><circle cx="${x - 2.5}" cy="${ey - 3}" r="${r * 0.33}" fill="${glint}"/>`;
  const arcUp = (x) => `<path d="M${x - 10} ${ey + 3} q10 -14 20 0" fill="none" stroke="${pupil}" stroke-width="5.5" stroke-linecap="round"/>`;
  const arcDown = (x) => `<path d="M${x - 10} ${ey - 2} q10 11 20 0" fill="none" stroke="${pupil}" stroke-width="5.5" stroke-linecap="round"/>`;
  const browInk = sp.patches ? '#fff' : INK;
  const brow = (x, dir, sad) => {
    // dir: -1 left eye, 1 right eye
    // Inner end low = cross; inner end high = sad.
    const y1 = sad ? ey - 21 : ey - 12;
    const y2 = sad ? ey - 13 : ey - 20;
    return `<path d="M${x - dir * 12} ${y1} L${x + dir * 9} ${y2}" stroke="${browInk}" stroke-width="5.5" stroke-linecap="round"/>`;
  };
  let eyes = '';
  switch (expr) {
    case 'happy':
      eyes = arcUp(ex[0]) + arcUp(ex[1]);
      break;
    case 'eating':
      eyes = arcDown(ex[0]) + arcDown(ex[1]);
      break;
    case 'grumpy':
      eyes = dot(ex[0], 6.5) + dot(ex[1], 6.5) + brow(ex[0], -1, false) + brow(ex[1], 1, false);
      break;
    case 'sad':
      eyes = dot(ex[0], 7) + dot(ex[1], 7) + brow(ex[0], -1, true) + brow(ex[1], 1, true)
        + `<path d="M${ex[1] + 12} ${ey + 8} q6 10 0 15 q-6 -5 0 -15z" fill="#7cc8ff" ${ink(2)}/>`;
      break;
    case 'wave':
    case 'thirsty':
      eyes = dot(ex[0], 9) + dot(ex[1], 9);
      break;
    default:
      eyes = dot(ex[0]) + dot(ex[1]);
  }
  void white;
  return `${out}<g class="eyes">${eyes}</g>`;
}

function snoutAndMouth(sp, expr, low = false) {
  let out = '';
  const frog = sp.ears === 'frog';
  let my = 128; // mouth baseline
  if (sp.cheeks) out += `<path d="M36 104 q24 -6 64 14 q40 -20 64 -14 q-2 44 -64 46 q-62 -2 -64 -46z" fill="${sp.inner}"/>`;
  if (sp.muzzle) out += `<ellipse cx="100" cy="122" rx="32" ry="24" fill="${sp.inner}"/>`;
  if (sp.snout) {
    out += `<ellipse cx="100" cy="116" rx="24" ry="17" fill="${sp.inner}" ${ink(4)}/><ellipse cx="92" cy="116" rx="4" ry="6" fill="${INK}"/><ellipse cx="108" cy="116" rx="4" ry="6" fill="${INK}"/>`;
    my = 140;
  } else if (sp.beak) {
    out += `<path d="M88 108 h24 l-12 20z" fill="${C.orange}" ${ink(4)}/>`;
    my = 138;
  } else if (sp.bigNose) {
    out += `<ellipse cx="100" cy="110" rx="14" ry="18" fill="#3a3a40" ${ink(3)}/><ellipse cx="96" cy="103" rx="4" ry="5" fill="#fff" opacity=".5"/>`;
    my = 138;
  } else if (frog) {
    const ny = low ? 112 : 96;
    out += `<circle cx="92" cy="${ny}" r="2.5" fill="${INK}"/><circle cx="108" cy="${ny}" r="2.5" fill="${INK}"/>`;
    my = low ? 128 : 118;
  } else if (sp.nose) {
    out += `<path d="M90 106 q10 -6 20 0 q-2 10 -10 11 q-8 -1 -10 -11z" fill="${sp.nose}" ${ink(2.5)}/>`;
    my = 128;
  }
  if (sp.whiskers) {
    out += `<g stroke="${INK}" stroke-width="2.5" stroke-linecap="round"><path d="M62 112 l-26 -6"/><path d="M62 120 l-26 4"/><path d="M138 112 l26 -6"/><path d="M138 120 l26 4"/></g>`;
  }
  const w = frog ? 26 : 13;
  let mouth;
  switch (expr) {
    case 'happy':
    case 'wave':
      mouth = `<path d="M${100 - w - 4} ${my - 4} q${w + 4} ${frog ? 30 : 28} ${2 * w + 8} 0z" fill="#8b1e2d" ${ink(4)}/>
        <path d="M${100 - w * 0.6} ${my + 7} q${w * 0.6} -7 ${w * 1.2} 0 q${-w * 0.6} 6 ${-w * 1.2} 0z" fill="#ff8fa3"/>`;
      break;
    case 'ok':
      mouth = `<path d="M${100 - w} ${my + 2} h${2 * w}" fill="none" ${ink(5)}/>`;
      break;
    case 'grumpy':
      mouth = `<path d="M${100 - w - 2} ${my + 2} q${w * 0.5} -8 ${w + 2} 0 q${w * 0.5} 8 ${w + 2} 0" fill="none" ${ink(5)}/>
        <path d="M${100 - 2} ${my + 3} q6 20 14 -1z" fill="#ff8fa3" ${ink(3)}/>`;
      break;
    case 'sad':
      mouth = `<path d="M${100 - w} ${my + 8} q${w} -14 ${2 * w} 0" fill="none" ${ink(5)}/>`;
      break;
    case 'eating':
      mouth = `<ellipse class="chew" cx="100" cy="${my + 2}" rx="${w * 0.8}" ry="6" fill="#8b1e2d" ${ink(4)}/>`;
      break;
    case 'thirsty':
      mouth = `<ellipse cx="100" cy="${my + 3}" rx="7" ry="8" fill="#8b1e2d" ${ink(4)}/>`;
      break;
    default:
      mouth = `<path d="M${100 - w} ${my - 2} q${w} ${frog ? 14 : 12} ${2 * w} 0" fill="none" ${ink(5)}/>`;
  }
  if (sp.teeth && (expr === 'idle' || expr === 'look' || expr === 'ok')) {
    mouth += `<rect x="94" y="${my + 2}" width="12" height="10" rx="2" fill="#fff" ${ink(2.5)}/><path d="M100 ${my + 2} v10" ${ink(2)}/>`;
  }
  return out + mouth;
}

function blush(expr) {
  if (expr !== 'happy' && expr !== 'eating' && expr !== 'wave') return '';
  return `<circle cx="52" cy="118" r="10" fill="#ff7d92" opacity=".5"/><circle cx="148" cy="118" r="10" fill="#ff7d92" opacity=".5"/>`;
}

function arm(x1, y1, x2, y2, fur, cls) {
  const d = `M${x1} ${y1} Q${(x1 + x2) / 2 + (x2 > x1 ? 16 : -16)} ${(y1 + y2) / 2 + 10} ${x2} ${y2}`;
  return `<g class="${cls}"><path d="${d}" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${fur}" stroke-width="17" stroke-linecap="round"/></g>`;
}

function accessory(look, sp) {
  let pick = Math.floor(seeded(look, 3) * 5);
  if (pick === 1 && (sp.ears === 'frog' || sp.discs || sp.patches)) pick = 0;
  if (pick === 0) {
    return `<path d="M100 178 l-20 -11 v22z" fill="${C.red}" ${ink(3.5)}/><path d="M100 178 l20 -11 v22z" fill="${C.red}" ${ink(3.5)}/><circle cx="100" cy="178" r="6" fill="${C.redDark}" ${ink(3)}/>`;
  }
  if (pick === 1) {
    return `<g fill="#bfe6ff" fill-opacity=".45" ${ink(4)}><circle cx="76" cy="96" r="17"/><circle cx="124" cy="96" r="17"/></g><path d="M93 96 h14" ${ink(4)}/>`;
  }
  if (pick === 2) {
    return `<path d="M132 44 l-20 -12 v24z" fill="${C.pink}" ${ink(3.5)}/><path d="M132 44 l20 -12 v24z" fill="${C.pink}" ${ink(3.5)}/><circle cx="132" cy="44" r="6" fill="#e86a92" ${ink(3)}/>`;
  }
  return '';
}

// ------------------------------------------------------------ chef outfits

const OUTFITS = {
  classic: { jacket: '#ffffff', trim: C.red, button: '#3a3a40' },
  bandana: { jacket: '#2f4a7a', trim: '#ffffff', button: '#ffd84a' },
  bunny: { jacket: '#ffd0dd', trim: '#ff7fa5', button: '#ffffff' },
  crown: { jacket: '#7d4fc4', trim: '#ffd84a', button: '#ffd84a' },
  wizard: { jacket: '#31408f', trim: '#ffd84a', button: '#ffd84a' },
  space: { jacket: '#f2f4f7', trim: C.orange, button: C.blue },
};

function hat(outfit) {
  switch (outfit) {
    case 'bandana':
      return `<path d="M36 76 q4 -44 64 -44 q60 0 64 44 q-64 -22 -128 0z" fill="${C.red}" ${ink(5)}/>
        <g fill="#fff"><circle cx="70" cy="52" r="5"/><circle cx="100" cy="44" r="5"/><circle cx="130" cy="52" r="5"/><circle cx="86" cy="64" r="4"/><circle cx="116" cy="62" r="4"/></g>
        <path d="M160 70 q22 -4 26 14 q-14 2 -20 -4 q4 14 -6 22 q-10 -12 0 -32z" fill="${C.red}" ${ink(4)}/>`;
    case 'bunny':
      return `<ellipse cx="74" cy="-2" rx="15" ry="38" fill="#fff" ${ink(5)} transform="rotate(-10 74 -2)"/><ellipse cx="126" cy="-2" rx="15" ry="38" fill="#fff" ${ink(5)} transform="rotate(10 126 -2)"/>
        <ellipse cx="74" cy="0" rx="7" ry="26" fill="#ffb3c7" transform="rotate(-10 74 0)"/><ellipse cx="126" cy="0" rx="7" ry="26" fill="#ffb3c7" transform="rotate(10 126 0)"/>
        <path d="M44 62 q6 -30 56 -30 q50 0 56 30 q-56 -16 -112 0z" fill="#ff9dbb" ${ink(5)}/>`;
    case 'crown':
      return `<path d="M52 58 l-8 -52 l30 26 l26 -36 l26 36 l30 -26 l-8 52z" fill="${C.yellow}" ${ink(5)}/>
        <rect x="50" y="48" width="100" height="16" rx="6" fill="#f2b21d" ${ink(5)}/>
        <circle cx="100" cy="32" r="8" fill="${C.red}" ${ink(3)}/><circle cx="68" cy="56" r="5" fill="${C.blue}" ${ink(2.5)}/><circle cx="132" cy="56" r="5" fill="${C.green}" ${ink(2.5)}/><circle cx="100" cy="56" r="5" fill="${C.pink}" ${ink(2.5)}/>`;
    case 'wizard':
      return `<path d="M62 54 q20 -70 62 -92 q-6 46 16 92z" fill="#4a3bb0" ${ink(5)}/>
        <path d="M28 62 q72 -30 144 0 q-72 18 -144 0z" fill="#5a49c9" ${ink(5)}/>
        <polygon points="104,-2 108,8 119,8 110,15 113,26 104,19 95,26 98,15 89,8 100,8" fill="${C.yellow}" ${ink(2.5)}/>
        <circle cx="84" cy="36" r="4" fill="${C.yellow}"/><circle cx="124" cy="40" r="3.5" fill="${C.yellow}"/>`;
    case 'space':
      return `<path d="M100 20 v-36" ${ink(5)}/><circle cx="100" cy="-22" r="9" fill="${C.red}" ${ink(4)}/>`;
    default:
      return `<path d="M54 44 q-30 -18 -8 -44 q6 -30 42 -22 q12 -14 30 0 q34 -8 40 22 q22 26 -12 44z" fill="#fff" ${ink(5)}/>
        <path d="M70 6 q4 16 0 30 M100 -6 v40 M130 6 q-4 16 0 30" fill="none" stroke="#d7dde3" stroke-width="4" stroke-linecap="round"/>
        <rect x="52" y="38" width="96" height="24" rx="8" fill="#fff" ${ink(5)}/>`;
  }
}

function helmet(outfit) {
  if (outfit !== 'space') return '';
  return `<circle cx="100" cy="98" r="84" fill="#bfe6ff" fill-opacity=".28" ${ink(5)}/>
    <path d="M40 60 q16 -34 50 -40" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>`;
}

/**
 * Draw an animal character.
 * @param {string} speciesId
 * @param {object} [o]
 * @param {string} [o.expr]     idle | wave | happy | ok | grumpy | sad | eating | thirsty
 * @param {number} [o.look]     seed for shirt colour and accessory
 * @param {string} [o.outfit]   chef outfit id; when set the animal wears chef whites
 * @param {boolean} [o.full]    draw legs too (the chef)
 * @param {string} [o.arms]     down | wave | up
 * @param {boolean} [o.headOnly] just the head (avatars)
 */
export function animalInner(speciesId, o = {}) {
  const sp = SPECIES[speciesId] || SPECIES.bear;
  const expr = o.expr || 'idle';
  const look = o.look ?? 0;
  const chef = !!o.outfit;
  const fit = OUTFITS[o.outfit] || OUTFITS.classic;
  const shirt = chef ? fit.jacket : SHIRTS[Math.floor(seeded(look, 1) * SHIRTS.length)];
  const arms = o.arms || (expr === 'wave' ? 'wave' : 'down');
  const low = chef && sp.ears === 'frog';

  let body = '';
  if (!o.headOnly) {
    const legs = o.full ? `<rect x="64" y="236" width="28" height="44" rx="12" fill="${sp.fur}" ${ink(5)}/><rect x="108" y="236" width="28" height="44" rx="12" fill="${sp.fur}" ${ink(5)}/>
      <ellipse cx="74" cy="282" rx="22" ry="11" fill="#3a3a40" ${ink(4)}/><ellipse cx="126" cy="282" rx="22" ry="11" fill="#3a3a40" ${ink(4)}/>` : '';
    const torsoBottom = o.full ? 'L150 244 q-50 14 -100 0 L42 226' : 'L160 232 h-120';
    const torso = `<path d="M42 226 q0 -62 58 -62 q58 0 58 62 ${torsoBottom}z" fill="${shirt}" ${ink(5)}/>`;
    const chefBits = chef ? `
      <path d="M100 172 v${o.full ? 66 : 58}" stroke="${fit.trim}" stroke-width="3" opacity=".5"/>
      <g fill="${fit.button}"><circle cx="86" cy="192" r="4.5"/><circle cx="114" cy="192" r="4.5"/><circle cx="86" cy="212" r="4.5"/><circle cx="114" cy="212" r="4.5"/></g>
      <path d="M70 166 q30 22 60 0 l-6 14 q-24 12 -48 0z" fill="${fit.trim}" ${ink(4)}/>` : accessoryBody(look);
    let armArt = '';
    if (arms === 'wave') {
      armArt = arm(52, 196, 44, 224, sp.fur, 'arm arm-l') + arm(148, 192, 186, 138, sp.fur, 'arm arm-r waving');
    } else if (arms === 'up') {
      armArt = arm(52, 192, 14, 138, sp.fur, 'arm arm-l cheering') + arm(148, 192, 186, 138, sp.fur, 'arm arm-r cheering');
    } else {
      armArt = arm(50, 196, 40, 226, sp.fur, 'arm arm-l') + arm(150, 196, 160, 226, sp.fur, 'arm arm-r');
    }
    body = `${legs}${torso}${chefBits}${armArt}`;
  }

  const stripes = sp.stripes ? `<g stroke="${sp.stripes}" stroke-width="6" stroke-linecap="round"><path d="M100 46 v14"/><path d="M84 50 l3 12"/><path d="M116 50 l-3 12"/></g>` : '';
  const spot = sp.spot ? `<path d="M118 60 q26 -6 36 20 q-4 22 -22 26 q-20 -16 -14 -46z" fill="${sp.spot}" opacity=".9"/>` : '';
  const head = `<g class="head">
      ${ears(sp, low, chef)}
      <ellipse cx="100" cy="100" rx="66" ry="60" fill="${sp.fur}" ${ink(5)}/>
      ${spot}${stripes}
      ${snoutAndMouth(sp, expr, low)}
      ${eyePair(sp, expr, low)}
      ${blush(expr)}
      ${!chef && !o.headOnly ? accessory(look, sp) : ''}
      ${chef ? hat(o.outfit) + helmet(o.outfit) : ''}
    </g>`;
  return body + head;
}

function accessoryBody() {
  return `<path d="M72 168 q28 20 56 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
}

export function customerSvg(look, expr = 'idle', extra = '') {
  const species = SPECIES_IDS[Math.floor(seeded(look, 7) * SPECIES_IDS.length)];
  return svg('0 -40 200 272', animalInner(species, { expr, look }), extra);
}

export function chefSvg(species, outfit = 'classic', o = {}, extra = '') {
  return svg('0 -64 200 360', animalInner(species, { outfit, full: true, expr: o.expr || 'idle', arms: o.arms }), extra);
}

/** Chef from the waist up, for cards and the chef's-eye layout. */
export function chefBustSvg(species, outfit = 'classic', o = {}, extra = '') {
  return svg('0 -64 200 296', animalInner(species, { outfit, expr: o.expr || 'idle', arms: o.arms }), extra);
}

export function avatarSvg(species, expr = 'idle', extra = '') {
  return svg('0 -34 200 200', animalInner(species, { expr, headOnly: true }), extra);
}
