// Difficulty progression: three independent dials raised one at a time.
//
//   cue  : 0 loud → 1 clear → 2 subtle → 3 silent
//   wait : 0 short → 4 long          (see WAIT_LEVELS in recipes.js)
//   conc : 0 one dish → 1 two dishes → 2 two dishes + customer interruptions
//
// Mastery is a success rate over the last N orders at the current level.
// Repeated failures step the level back down so nobody gets stuck frustrated.

export const CUE = { LOUD: 0, CLEAR: 1, SUBTLE: 2, SILENT: 3 };
export const MAX_DIALS = { cue: 3, wait: 4, conc: 2 };

// Each rung raises exactly one dial compared to the previous one.
export const LADDER = [
  { cue: 0, wait: 0, conc: 0, window: 6, need: 5 },
  { cue: 0, wait: 1, conc: 0 },
  { cue: 1, wait: 1, conc: 0 },
  { cue: 1, wait: 2, conc: 0 },
  { cue: 1, wait: 2, conc: 1 },
  { cue: 2, wait: 2, conc: 1 },
  { cue: 2, wait: 3, conc: 1 },
  { cue: 2, wait: 3, conc: 2 },
  { cue: 3, wait: 3, conc: 2 },
  { cue: 3, wait: 4, conc: 2 },
];

export const MAX_LEVEL = LADDER.length - 1;
export const DEFAULT_WINDOW = 10;
export const DEFAULT_NEED = 8;
const DOWN_WINDOW = 6;
const DOWN_MAX_SUCCESS = 2;
const DOWN_STREAK = 3;

export function clampLevel(level) {
  return Math.max(0, Math.min(MAX_LEVEL, level | 0));
}

export function clampDials(d) {
  const c = (v, max) => Math.max(0, Math.min(max, Number.isFinite(+v) ? Math.round(+v) : 0));
  return { cue: c(d.cue, MAX_DIALS.cue), wait: c(d.wait, MAX_DIALS.wait), conc: c(d.conc, MAX_DIALS.conc) };
}

export function rung(level) {
  const r = LADDER[clampLevel(level)];
  return { window: DEFAULT_WINDOW, need: DEFAULT_NEED, ...r };
}

/** Dials for a level, or the parent's manual override when enabled. */
export function dialsFor(level, override) {
  if (override && override.enabled) return clampDials(override);
  const r = rung(level);
  return { cue: r.cue, wait: r.wait, conc: r.conc };
}

/** An order counts as a success when it was served and not ruined. */
export function isSuccess(stars) {
  return stars >= 2;
}

/**
 * Record one finished order and decide whether to move on the ladder.
 * `state` is { level, recent: boolean[] } and is not mutated.
 * Returns { level, recent, change: 'up' | 'down' | null }.
 */
export function recordOrder(state, stars, { locked = false } = {}) {
  const level = clampLevel(state.level);
  const { window, need } = rung(level);
  const recent = [...(state.recent || []), isSuccess(stars)].slice(-Math.max(window, DOWN_WINDOW));
  if (locked) return { level, recent, change: null };

  const lastN = recent.slice(-window);
  if (level < MAX_LEVEL && lastN.length >= window && lastN.filter(Boolean).length >= need) {
    return { level: level + 1, recent: [], change: 'up' };
  }

  if (level > 0) {
    const streak = recent.slice(-DOWN_STREAK);
    const streakFail = streak.length >= DOWN_STREAK && streak.every((s) => !s);
    const lastDown = recent.slice(-DOWN_WINDOW);
    const manyFail = lastDown.length >= DOWN_WINDOW && lastDown.filter(Boolean).length <= DOWN_MAX_SUCCESS;
    if (streakFail || manyFail) return { level: level - 1, recent: [], change: 'down' };
  }
  return { level, recent, change: null };
}

/** Progress toward the next level, for the in-game mastery meter. */
export function masteryProgress(state) {
  const { window, need } = rung(state.level);
  const lastN = (state.recent || []).slice(-window);
  return { window, need, results: lastN, successes: lastN.filter(Boolean).length };
}

/** Which layout suits the dials: counter view for one dish, split kitchen for two. */
export function layoutFor(dials, preference = 'auto') {
  if (preference === 1 || preference === 2 || preference === 3) return preference;
  return dials.conc >= 1 ? 2 : 1;
}
