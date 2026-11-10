import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LADDER, MAX_LEVEL, dialsFor, recordOrder, masteryProgress, layoutFor, rung, clampDials,
} from '../src/engine/difficulty.js';
import { RECIPES, WAIT_LEVELS, WINDOWS, stationsFor, stepTiming } from '../src/engine/recipes.js';
import { Store, createProfile, STORAGE_KEY, dayKey } from '../src/engine/storage.js';
import { summarizeSession, applySession, aggregate, dayStatus } from '../src/engine/stats.js';
import { buy, equip, isEquipped, unlockedRecipes, CATALOG, item } from '../src/engine/catalog.js';
import { GameClock } from '../src/engine/clock.js';
import { makeRng } from '../src/engine/rng.js';

function feed(state, stars, n) {
  let s = state;
  let change = null;
  for (let i = 0; i < n; i++) {
    const r = recordOrder(s, stars);
    s = { level: r.level, recent: r.recent };
    if (r.change) change = r.change;
  }
  return { ...s, change };
}

test('each ladder rung raises exactly one dial by one', () => {
  for (let i = 1; i < LADDER.length; i++) {
    const a = LADDER[i - 1];
    const b = LADDER[i];
    const diffs = ['cue', 'wait', 'conc'].map((k) => b[k] - a[k]);
    assert.deepEqual(diffs.filter((d) => d !== 0), [1], `rung ${i}`);
  }
  const top = LADDER[MAX_LEVEL];
  assert.deepEqual({ cue: top.cue, wait: top.wait, conc: top.conc }, { cue: 3, wait: 4, conc: 2 });
});

test('mastery of 8 out of the last 10 orders unlocks the next level', () => {
  let s = { level: 1, recent: [] };
  // 2 fails then 8 successes = 8 of 10.
  s = feed(s, 1, 2);
  assert.equal(s.level, 1);
  const r = feed(s, 3, 8);
  assert.equal(r.level, 2);
  assert.equal(r.change, 'up');
  assert.deepEqual(r.recent, []);
});

test('7 of 10 is not enough', () => {
  let s = { level: 1, recent: [] };
  const pattern = [3, 3, 1, 3, 3, 1, 3, 3, 1, 3]; // 7 successes
  for (const stars of pattern) {
    const r = recordOrder(s, stars);
    s = { level: r.level, recent: r.recent };
  }
  assert.equal(s.level, 1);
});

test('the first level needs only 5 of 6', () => {
  assert.equal(rung(0).window, 6);
  const r = feed({ level: 0, recent: [] }, 2, 6);
  assert.equal(r.level, 1);
});

test('late-but-served (2 stars) counts as success, ruined (1 star) does not', () => {
  const ok = feed({ level: 2, recent: [] }, 2, 10);
  assert.equal(ok.level, 3);
  const bad = feed({ level: 2, recent: [] }, 1, 2);
  assert.equal(bad.level, 2);
});

test('three failures in a row step back down, never below level 0', () => {
  const r = feed({ level: 3, recent: [] }, 0, 3);
  assert.equal(r.level, 2);
  assert.equal(r.change, 'down');
  const floor = feed({ level: 0, recent: [] }, 0, 12);
  assert.equal(floor.level, 0);
});

test('mostly failing over six orders steps down even without a streak', () => {
  let s = { level: 4, recent: [] };
  for (const stars of [1, 3, 1, 1, 3, 1]) {
    const r = recordOrder(s, stars);
    s = { level: r.level, recent: r.recent };
  }
  assert.equal(s.level, 3);
});

test('top level never goes past the ladder; locked dials never move', () => {
  const top = feed({ level: MAX_LEVEL, recent: [] }, 3, 30);
  assert.equal(top.level, MAX_LEVEL);
  let s = { level: 2, recent: [] };
  for (let i = 0; i < 20; i++) {
    const r = recordOrder(s, 3, { locked: true });
    s = { level: r.level, recent: r.recent };
    assert.equal(r.change, null);
  }
  assert.equal(s.level, 2);
});

test('parent override replaces the ladder dials', () => {
  assert.deepEqual(dialsFor(0), { cue: 0, wait: 0, conc: 0 });
  assert.deepEqual(dialsFor(0, { enabled: true, cue: 3, wait: 9, conc: 1 }), { cue: 3, wait: 4, conc: 1 });
  assert.deepEqual(dialsFor(4, { enabled: false, cue: 3, wait: 4, conc: 2 }), { cue: 1, wait: 2, conc: 1 });
  assert.deepEqual(clampDials({ cue: -2, wait: 'x', conc: 7 }), { cue: 0, wait: 0, conc: 2 });
});

test('mastery meter and layout choice', () => {
  const m = masteryProgress({ level: 1, recent: [true, false, true] });
  assert.equal(m.window, 10);
  assert.equal(m.need, 8);
  assert.equal(m.successes, 2);
  assert.equal(layoutFor({ conc: 0 }), 1);
  assert.equal(layoutFor({ conc: 1 }), 2);
  assert.equal(layoutFor({ conc: 0 }, 3), 3);
});

test('wait dial gets longer and windows get tighter', () => {
  for (let i = 1; i < WAIT_LEVELS.length; i++) {
    assert.ok(WAIT_LEVELS[i][0] > WAIT_LEVELS[i - 1][1] - 0.01);
    assert.ok(WINDOWS[i].perfect <= WINDOWS[i - 1].perfect);
    assert.ok(WINDOWS[i].grace <= WINDOWS[i - 1].grace);
  }
  const rng = makeRng(1);
  const t = stepTiming(4, { waitMul: 1 }, rng);
  assert.ok(t.wait >= 32 && t.wait <= 40);
  assert.ok(WAIT_LEVELS.at(-1)[1] <= 40);
});

test('every recipe has a station, a start action and at least one timed step', () => {
  for (const r of Object.values(RECIPES)) {
    assert.ok(r.station && r.start, r.id);
    assert.ok(r.steps.some((s) => s.timed), r.id);
  }
  assert.deepEqual(stationsFor(['toast', 'mac', 'pancakes']), ['stove', 'griddle', 'toaster']);
  assert.deepEqual(stationsFor(['cookies', 'toast']), ['toaster', 'oven']);
});

test('profiles are stored independently and survive a reload', () => {
  const mem = new Map();
  const backend = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  const store = new Store(backend);
  const a = store.addProfile({ name: 'Ada', avatar: 'fox' });
  const b = store.addProfile({ name: 'Ben', avatar: 'bear' });
  a.coins = 50;
  a.level = 3;
  b.level = 1;
  store.save();
  const again = new Store(backend);
  assert.equal(again.profiles.length, 2);
  assert.equal(again.profile(a.id).coins, 50);
  assert.equal(again.profile(a.id).level, 3);
  assert.equal(again.profile(b.id).level, 1);
  assert.ok(mem.has(STORAGE_KEY));
});

test('corrupt storage does not crash and bad values are repaired', () => {
  const backend = { getItem: () => '{not json', setItem() {}, removeItem() {} };
  assert.equal(new Store(backend).profiles.length, 0);
  const weird = {
    getItem: () => JSON.stringify({ profiles: [{ id: 'x', name: 'Zed', coins: -5, level: 99, owned: 'nope' }] }),
    setItem() {}, removeItem() {},
  };
  const p = new Store(weird).profiles[0];
  assert.equal(p.coins, 0);
  assert.equal(p.level, MAX_LEVEL);
  assert.ok(p.owned.includes('toast'));
});

test('shop: buying spends coins, unlocks recipes and equips items', () => {
  const p = createProfile({ name: 'Kid' });
  assert.equal(buy(p, 'soup'), false); // no coins
  p.coins = 200;
  assert.equal(buy(p, 'soup'), true);
  assert.equal(p.coins, 200 - item('soup').price);
  assert.ok(unlockedRecipes(p).includes('soup'));
  assert.equal(buy(p, 'soup'), false); // already owned
  assert.equal(buy(p, 'cat'), true);
  assert.equal(p.equipped.pet, 'cat');
  equip(p, 'cat');
  assert.equal(p.equipped.pet, null);
  assert.equal(buy(p, 'plant'), true);
  assert.ok(isEquipped(p, 'plant'));
  equip(p, 'plant', false);
  assert.ok(!isEquipped(p, 'plant'));
  assert.equal(new Set(CATALOG.map((i) => i.id)).size, CATALOG.length);
});

test('session summary feeds the parent dashboard numbers', () => {
  const p = createProfile({ name: 'Kid' });
  const session = {
    orders: [
      { stars: 3, rt: 1.0 }, { stars: 3, rt: 2.0 }, { stars: 2, rt: 6.0 }, { stars: 1, rt: null }, { stars: 0, rt: null },
    ],
    spaceOuts: 2, peeks: 4, busywork: 9, missedCustomers: 0, cookingTime: 300, stars: 9, coins: 20,
  };
  const date = new Date(2026, 0, 5, 16, 0);
  const sum = summarizeSession(session, { durationSec: 420, levelStart: 1, levelEnd: 2, date });
  assert.equal(sum.orders, 5);
  assert.equal(sum.success, 3);
  assert.equal(sum.perfect, 2);
  assert.equal(sum.ruined, 1);
  assert.equal(sum.abandoned, 1);
  assert.equal(sum.avgRt, 3);
  applySession(p, sum);
  const agg = aggregate(p);
  assert.equal(agg.sessions, 1);
  assert.equal(agg.successRate, 0.6);
  assert.equal(agg.avgRt, 3);
  assert.equal(agg.spaceOutsPerSession, 2);
  assert.equal(agg.spaceOutsPer10Min, 4);
  assert.equal(p.days[dayKey(date)].playedSec, 420);
  assert.equal(p.stats.totals.bestLevel, 2);
});

test('daily goal, cap and cool-down', () => {
  const p = createProfile({ name: 'Kid' });
  const globals = { goalMin: 7, capMin: 15, cooldownMin: 0 };
  const now = new Date(2026, 0, 5, 16, 0);
  let d = dayStatus(p, globals, now);
  assert.equal(d.canPlay, true);
  assert.equal(d.sessionSec, 420);
  assert.equal(d.goalProgress, 0);

  p.days[dayKey(now)] = { playedSec: 200, sessions: 1 };
  d = dayStatus(p, globals, now);
  assert.equal(d.sessionSec, 220); // finish today's goal
  assert.ok(!d.goalMet);

  p.days[dayKey(now)] = { playedSec: 420, sessions: 1 };
  d = dayStatus(p, globals, now);
  assert.ok(d.goalMet);
  assert.equal(d.sessionSec, 420); // an extra session

  p.days[dayKey(now)] = { playedSec: 880, sessions: 2 };
  d = dayStatus(p, globals, now);
  assert.equal(d.canPlay, false); // under a minute left of the 15-minute cap
  assert.ok(d.capped);

  // A new day starts fresh.
  d = dayStatus(p, globals, new Date(2026, 0, 6, 9, 0));
  assert.equal(d.canPlay, true);

  // Cool-down between sessions.
  p.days[dayKey(now)] = { playedSec: 420, sessions: 1 };
  p.lastSessionEnd = now.getTime() - 60_000;
  d = dayStatus(p, { goalMin: 7, capMin: 0, cooldownMin: 5 }, now);
  assert.equal(d.canPlay, false);
  assert.ok(d.cooldownLeft > 230 && d.cooldownLeft <= 240);
});

test('game clock pauses when backgrounded and never jumps', () => {
  let now = 0;
  let pending = null;
  const ticks = [];
  const clock = new GameClock((dt) => ticks.push(dt), {
    raf: (fn) => { pending = fn; return 1; },
    caf: () => { pending = null; },
    now: () => now,
  });
  const frame = (ms) => { now += ms; const fn = pending; pending = null; fn(); };
  clock.start();
  frame(16);
  assert.equal(ticks.length, 1);
  assert.ok(Math.abs(ticks[0] - 0.016) < 1e-9);
  clock.pause('hidden');
  frame(5000);
  assert.equal(ticks.length, 1); // nothing while paused
  clock.resume('hidden');
  frame(16);
  assert.equal(ticks.length, 2);
  assert.ok(ticks[1] <= 0.1);
  // A long frame is clamped rather than fast-forwarding the kitchen.
  frame(3000);
  assert.ok(ticks.at(-1) <= 0.1 + 1e-9);
  const total = ticks.reduce((a, b) => a + b, 0);
  assert.ok(total < 0.25);
  clock.stop();
});

test('an interrupted session is committed on the next start', async () => {
  const { commitPending, addPlayTime, MIN_SESSION_SEC } = await import('../src/engine/stats.js');
  const p = createProfile({ name: 'Kid' });
  const date = new Date(2026, 0, 5, 16, 0);
  // Long enough (or with orders): becomes a real session record.
  p.pending = summarizeSession({ orders: [{ stars: 3, rt: 1 }], spaceOuts: 0, peeks: 0, busywork: 2, missedCustomers: 0, cookingTime: 30, stars: 3, coins: 6 },
    { durationSec: 95, levelStart: 0, levelEnd: 0, date });
  assert.equal(commitPending(p), true);
  assert.equal(p.pending, null);
  assert.equal(p.stats.sessions.length, 1);
  assert.equal(p.days[dayKey(date)].playedSec, 95);
  assert.equal(commitPending(p), false);
  // A few seconds with no orders: only the play time counts.
  p.pending = summarizeSession({ orders: [], spaceOuts: 0, peeks: 0, busywork: 0, missedCustomers: 0, cookingTime: 0, stars: 0, coins: 0 },
    { durationSec: MIN_SESSION_SEC - 10, levelStart: 0, levelEnd: 0, date });
  commitPending(p);
  assert.equal(p.stats.sessions.length, 1);
  assert.equal(p.days[dayKey(date)].playedSec, 95 + MIN_SESSION_SEC - 10);
  addPlayTime(p, 5, date);
  assert.equal(p.days[dayKey(date)].playedSec, 100 + MIN_SESSION_SEC - 10);
});

test('stored profiles are repaired field by field', () => {
  const raw = {
    profiles: [{
      id: 'x', name: 'A very very long name indeed', avatar: 'dinosaur', tutorialDone: 'yes', lastSessionEnd: 'never',
      days: { '2026-01-05': { playedSec: 'lots', sessions: -3 }, junk: null },
      stats: { sessions: [null, { orders: 4, success: 3 }, 'nope'] },
      pending: { durationSec: 'x' },
    }],
  };
  const store = new Store({ getItem: () => JSON.stringify(raw), setItem() {}, removeItem() {} });
  const p = store.profiles[0];
  assert.equal(p.name.length, 16);
  assert.equal(p.avatar, 'fox');
  assert.equal(p.tutorialDone, true);
  assert.equal(p.lastSessionEnd, 0);
  assert.deepEqual(p.days, { '2026-01-05': { playedSec: 0, sessions: 0 } });
  assert.equal(p.stats.sessions.length, 1);
  assert.equal(p.pending, null);
  assert.ok(dayStatus(p, { goalMin: 7, capMin: 20, cooldownMin: 5 }).canPlay);
});
