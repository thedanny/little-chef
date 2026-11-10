// Recipes, stations and the timing tables behind the "wait length" dial.
//
// A recipe is: one start action (tap the idle station), then a list of steps.
//  - timed steps  : a wait window, then the action must be done in time.
//                   These are the prospective-memory targets.
//  - quick steps  : an immediate follow-up tap with no timer (add cheese, butter).
// After the last step the dish is plated and served automatically.

export const STATION_ORDER = ['stove', 'griddle', 'toaster', 'fryer', 'oven'];

export const RECIPES = {
  pancakes: {
    id: 'pancakes', station: 'griddle', base: true, start: 'pour',
    steps: [
      { action: 'flip', timed: true, waitMul: 1.0 },
      { action: 'plate', timed: true, waitMul: 0.7 },
    ],
  },
  mac: {
    id: 'mac', station: 'stove', base: true, start: 'boil',
    steps: [
      { action: 'drain', timed: true, waitMul: 1.15 },
      { action: 'cheese', timed: false },
    ],
  },
  toast: {
    id: 'toast', station: 'toaster', base: true, start: 'insert',
    steps: [
      { action: 'pop', timed: true, waitMul: 0.8 },
      { action: 'butter', timed: false },
    ],
  },
  soup: {
    id: 'soup', station: 'stove', base: false, start: 'veggies',
    steps: [
      { action: 'stir', timed: true, waitMul: 0.9 },
      { action: 'ladle', timed: true, waitMul: 0.9 },
    ],
  },
  grilled: {
    id: 'grilled', station: 'griddle', base: false, start: 'place',
    steps: [
      { action: 'flip', timed: true, waitMul: 0.9 },
      { action: 'plate', timed: true, waitMul: 0.8 },
    ],
  },
  fries: {
    id: 'fries', station: 'fryer', base: false, start: 'drop',
    steps: [
      { action: 'lift', timed: true, waitMul: 1.1 },
      { action: 'salt', timed: false },
    ],
  },
  cookies: {
    id: 'cookies', station: 'oven', base: false, start: 'tray',
    steps: [
      { action: 'takeout', timed: true, waitMul: 1.25 },
      { action: 'sprinkle', timed: false },
    ],
  },
};

export const BASE_RECIPES = Object.values(RECIPES).filter((r) => r.base).map((r) => r.id);

/** Seconds of waiting before a timed step, per level of the wait dial. */
export const WAIT_LEVELS = [
  [8, 11],
  [12, 16],
  [17, 23],
  [24, 31],
  [32, 40],
];

/** Perfect window and grace period (seconds) per level of the wait dial. */
export const WINDOWS = [
  { perfect: 6, grace: 7 },
  { perfect: 5.5, grace: 6.5 },
  { perfect: 5, grace: 6 },
  { perfect: 4.5, grace: 5.5 },
  { perfect: 4, grace: 5 },
];

export const MAX_WAIT_DIAL = WAIT_LEVELS.length - 1;

export function stationsFor(recipeIds) {
  const used = new Set(recipeIds.map((id) => RECIPES[id]?.station).filter(Boolean));
  return STATION_ORDER.filter((s) => used.has(s));
}

/** Timing for one timed step at a given wait dial. `rng` picks inside the range. */
export function stepTiming(waitDial, step, rng) {
  const d = Math.max(0, Math.min(MAX_WAIT_DIAL, waitDial | 0));
  const [lo, hi] = WAIT_LEVELS[d];
  const base = rng ? rng.range(lo, hi) : (lo + hi) / 2;
  return {
    wait: base * (step.waitMul ?? 1),
    perfect: WINDOWS[d].perfect,
    grace: WINDOWS[d].grace,
  };
}

export function timedStepCount(recipeId) {
  return RECIPES[recipeId].steps.filter((s) => s.timed).length;
}
