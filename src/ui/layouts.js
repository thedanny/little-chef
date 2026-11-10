// Screen layouts: where every piece of the kitchen sits on the 1280×800 stage.
// All three are landscape with big tap targets; the view places elements from
// these rectangles so the game logic never cares which layout is showing.
//
//  1  Classic Counter  – stations along the bottom, customers behind a counter.
//  2  Split Kitchen    – cooking on the left, dining room + busywork on the right.
//  3  Chef's Eye       – first-person over the stations, customers at a hatch.

const STATION_ASPECT = 220 / 240;

function row(n, { left, right, bottom, maxW }) {
  const span = right - left;
  const spacing = Math.min(maxW + 80, span / n);
  const w = Math.min(maxW, spacing - 16);
  const h = w * STATION_ASPECT;
  const start = left + (span - spacing * n) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: start + spacing * i + (spacing - w) / 2, y: bottom - h, w, h }));
}

const layout1 = {
  id: 1,
  scene: 'scene1',
  collectPlates: false,
  customerClip: 430, // customers pop up from behind the counter
  customers: [
    { x: 305, y: 150, w: 190, h: 258 },
    { x: 785, y: 150, w: 190, h: 258 },
  ],
  bubbles: [
    { x: 492, y: 150, size: 132, tail: 'left' },
    { x: 656, y: 150, size: 132, tail: 'right' },
  ],
  juiceBubbles: [
    { x: 236, y: 236, size: 84 },
    { x: 960, y: 236, size: 84 },
  ],
  dishes: [
    { x: 345, y: 322, size: 110 },
    { x: 825, y: 322, size: 110 },
  ],
  stations: (n) => row(n, { left: 40, right: 1240, bottom: 794, maxW: 250 }),
  fridge: { x: 24, y: 216, w: 190, h: 330 },
  sink: { x: 1062, y: 272, w: 210, h: 270 },
  juice: { x: 606, y: 318, w: 68, h: 82 },
  pet: { x: 940, y: 432, w: 116, h: 116 },
  spills: [
    { x: 290, y: 410 }, { x: 520, y: 410 }, { x: 760, y: 410 }, { x: 1000, y: 410 },
  ],
  chef: { mode: 'row', y: 396, w: 136, h: 245, minX: 250, maxX: 930, homeX: 640, z: 6 },
  decor: {
    window: { x: 1072, y: 92, w: 190, h: 171 },
    clock: { x: 230, y: 112, w: 76, h: 76 },
    picture: { x: 962, y: 128, w: 92, h: 80 },
    plant: { x: 40, y: 128, w: 68, h: 95 },
    fishbowl: { x: 124, y: 150, w: 70, h: 70 },
    bunting: { x: 318, y: 92, w: 640, h: 56 },
    lights: { x: 226, y: 80, w: 828, h: 46 },
  },
  z: { customers: 2, counter: 3, counterItems: 4, props: 4, pet: 5, chef: 6, worktop: 7, stations: 8 },
};

function stations2(n) {
  if (n <= 3) {
    const w = 250;
    const h = w * STATION_ASPECT;
    const gap = (800 - 92 - 6 - h * 3) / 2;
    return Array.from({ length: n }, (_, i) => ({ x: 150, y: 92 + i * (h + gap), w, h }));
  }
  const w = 236;
  const h = w * STATION_ASPECT;
  const ys = n === 4 ? [150, 470] : [96, 330, 564];
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: i % 2 === 0 ? 20 : 286, y: ys[Math.floor(i / 2)], w, h });
  return out;
}

const layout2 = {
  id: 2,
  scene: 'scene2',
  collectPlates: true,
  customers: [
    { x: 716, y: 190, w: 176, h: 239 },
    { x: 1034, y: 190, w: 176, h: 239 },
  ],
  bubbles: [
    { x: 876, y: 92, size: 120, tail: 'left' },
    { x: 1156, y: 92, size: 120, tail: 'left' },
  ],
  juiceBubbles: [
    { x: 664, y: 250, size: 80 },
    { x: 1196, y: 250, size: 80 },
  ],
  dishes: [
    { x: 752, y: 358, size: 104 },
    { x: 1070, y: 358, size: 104 },
  ],
  tables: [
    { x: 674, y: 408, w: 260, h: 150 },
    { x: 992, y: 408, w: 260, h: 150 },
  ],
  stations: stations2,
  fridge: { x: 676, y: 548, w: 145, h: 252 },
  sink: { x: 1078, y: 552, w: 196, h: 252 },
  juice: { x: 880, y: 650, w: 74, h: 89 },
  pet: { x: 962, y: 680, w: 112, h: 112 },
  spills: [
    { x: 716, y: 440 }, { x: 892, y: 440 }, { x: 1034, y: 440 }, { x: 1210, y: 440 },
  ],
  chef: { mode: 'free', w: 124, h: 223, homeX: 600, homeY: 420, laneX: 598, diningX: 901, diningY: 404, z: 6 },
  decor: {
    window: { x: 668, y: 98, w: 136, h: 122 },
    clock: { x: 1040, y: 100, w: 72, h: 72 },
    picture: { x: 915, y: 236, w: 96, h: 84 },
    plant: { x: 836, y: 690, w: 0, h: 0 },
    fishbowl: { x: 720, y: 494, w: 62, h: 62 },
    bunting: { x: 664, y: 84, w: 612, h: 44 },
    lights: { x: 664, y: 84, w: 612, h: 40 },
  },
  z: { customers: 2, counter: 3, counterItems: 4, props: 4, pet: 5, chef: 6, worktop: 3, stations: 4 },
};

const layout3 = {
  id: 3,
  scene: 'scene3',
  collectPlates: false,
  customerClip: 360, // customers pop up behind the serving hatch
  customers: [
    { x: 380, y: 96, w: 180, h: 245 },
    { x: 720, y: 96, w: 180, h: 245 },
  ],
  bubbles: [
    { x: 262, y: 118, size: 122, tail: 'right' },
    { x: 896, y: 118, size: 122, tail: 'left' },
  ],
  juiceBubbles: [
    { x: 548, y: 132, size: 78 },
    { x: 662, y: 132, size: 78 },
  ],
  dishes: [
    { x: 418, y: 262, size: 104 },
    { x: 758, y: 262, size: 104 },
  ],
  stations: (n) => row(n, { left: 222, right: 1074, bottom: 690, maxW: 252 }),
  fridge: { x: 1092, y: 372, w: 172, h: 299 },
  sink: { x: 8, y: 404, w: 204, h: 262 },
  juice: { x: 608, y: 260, w: 64, h: 77 },
  pet: { x: 1100, y: 676, w: 110, h: 110 },
  spills: [
    { x: 300, y: 342 }, { x: 600, y: 344 }, { x: 680, y: 344 }, { x: 980, y: 342 },
  ],
  chef: { mode: 'paws', y: 706, w: 400, h: 124, minX: 226, maxX: 654, homeX: 440, z: 9 },
  decor: {
    window: { x: 0, y: 0, w: 0, h: 0 },
    clock: { x: 84, y: 110, w: 84, h: 84 },
    picture: { x: 1104, y: 110, w: 108, h: 94 },
    plant: { x: 1196, y: 286, w: 64, h: 90 },
    fishbowl: { x: 1104, y: 304, w: 70, h: 70 },
    bunting: { x: 254, y: 84, w: 772, h: 40 },
    lights: { x: 254, y: 84, w: 772, h: 36 },
  },
  z: { customers: 2, counter: 3, counterItems: 4, props: 4, pet: 5, chef: 9, worktop: 3, stations: 5 },
};

export const LAYOUTS = { 1: layout1, 2: layout2, 3: layout3 };

export function getLayout(id) {
  return LAYOUTS[id] || layout1;
}
