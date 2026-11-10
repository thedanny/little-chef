import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kitchen, TUNING } from '../src/engine/kitchen.js';
import { makeRng } from '../src/engine/rng.js';
import { RECIPES } from '../src/engine/recipes.js';

const STEP = 0.05;

function make(opts = {}) {
  const k = new Kitchen({
    dials: { cue: 0, wait: 0, conc: 0, ...(opts.dials || {}) },
    recipes: opts.recipes || ['toast'],
    rng: makeRng(opts.seed ?? 7),
    options: opts.options || {},
  });
  const events = [];
  k.on((type, data) => events.push({ type, data }));
  return { k, events };
}

function run(k, seconds, { keepBusy = false } = {}) {
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n; i++) {
    k.update(STEP);
    if (keepBusy) k.noteInput();
  }
}

function runUntil(k, pred, max = 300, { keepBusy = true } = {}) {
  let t = 0;
  while (!pred() && t < max) {
    k.update(STEP);
    if (keepBusy) k.noteInput();
    t += STEP;
  }
  assert.ok(pred(), 'condition was not reached in time');
  return t;
}

/** Bring the first customer in and take their order. */
function greetFirst(k) {
  runUntil(k, () => k.customers.some((c) => c && c.state === 'waiting'));
  const c = k.customers.find((x) => x && x.state === 'waiting');
  assert.equal(k.tapCustomer(c.slot), 'greeted');
  return c;
}

test('a customer arrives, is greeted and shows an order', () => {
  const { k, events } = make();
  const c = greetFirst(k);
  assert.equal(c.state, 'ordered');
  assert.equal(c.recipeId, 'toast');
  assert.ok(events.some((e) => e.type === 'customer-arrive'));
  assert.ok(events.some((e) => e.type === 'greeted'));
});

test('perfect timing on every step serves a 3-star dish', () => {
  const { k, events } = make();
  const c = greetFirst(k);
  assert.equal(k.tapStation('toaster'), 'start');
  const st = k.stations.toaster;
  assert.equal(st.phase, 'wait');
  assert.equal(k.plates.clean, TUNING.totalPlates - TUNING.startDirty - 1);
  runUntil(k, () => st.phase === 'ready');
  assert.equal(k.tapStation('toaster'), 'perfect');
  assert.equal(st.phase, 'quick'); // butter
  assert.equal(k.nextAction(st), 'butter');
  assert.equal(k.tapStation('toaster'), 'quick');
  assert.equal(st.phase, 'idle');
  assert.equal(c.state, 'eating');
  const served = events.find((e) => e.type === 'served');
  assert.equal(served.data.stars, 3);
  assert.equal(k.session.orders.length, 1);
  assert.equal(k.session.orders[0].stars, 3);
  assert.ok(k.session.orders[0].rt >= 0 && k.session.orders[0].rt < 1);
});

test('acting in the grace period is late: 2 stars', () => {
  const { k } = make();
  greetFirst(k);
  k.tapStation('toaster');
  const st = k.stations.toaster;
  runUntil(k, () => st.phase === 'late');
  assert.equal(k.tapStation('toaster'), 'late');
  k.tapStation('toaster');
  assert.equal(k.session.orders[0].stars, 2);
  assert.ok(k.session.orders[0].rt >= st.perfect || k.session.orders[0].rt > 5);
});

test('missing the window burns the dish; it can still be served for 1 star', () => {
  const { k, events } = make();
  const c = greetFirst(k);
  k.tapStation('toaster');
  const st = k.stations.toaster;
  runUntil(k, () => st.phase === 'burnt');
  assert.ok(events.some((e) => e.type === 'burnt'));
  assert.equal(k.tapStation('toaster'), 'served');
  assert.equal(k.session.orders[0].stars, 1);
  assert.equal(c.dish.burnt, true);
  assert.equal(st.phase, 'idle');
});

test('a burnt dish left alone is abandoned: 0 stars and the customer leaves', () => {
  const { k, events } = make();
  const c = greetFirst(k);
  k.tapStation('toaster');
  const st = k.stations.toaster;
  runUntil(k, () => st.phase === 'burnt');
  runUntil(k, () => st.phase === 'idle', TUNING.burntAbandon + 2);
  assert.equal(k.session.orders[0].stars, 0);
  assert.equal(k.session.orders[0].abandoned, true);
  assert.ok(events.some((e) => e.type === 'abandoned'));
  assert.equal(c.state, 'leaving');
});

test('tapping a cooking station early is a peek, not the action', () => {
  const { k, events } = make();
  greetFirst(k);
  k.tapStation('toaster');
  const st = k.stations.toaster;
  run(k, 1, { keepBusy: true });
  assert.equal(k.tapStation('toaster'), 'peek');
  assert.ok(k.isPeeking(st));
  assert.equal(k.tapStation('toaster'), 'locked');
  assert.equal(st.phase, 'wait');
  assert.equal(st.peeks, 1);
  run(k, TUNING.peekShow + 0.2, { keepBusy: true });
  assert.ok(!k.isPeeking(st));
  assert.ok(events.some((e) => e.type === 'peek'));
});

test('pancakes have two timed steps and take the worst outcome', () => {
  const { k } = make({ recipes: ['pancakes'] });
  greetFirst(k);
  k.tapStation('griddle');
  const st = k.stations.griddle;
  runUntil(k, () => st.phase === 'ready');
  assert.equal(k.nextAction(st), 'flip');
  k.tapStation('griddle'); // perfect flip
  assert.equal(st.phase, 'wait');
  runUntil(k, () => st.phase === 'late');
  assert.equal(k.nextAction(st), 'plate');
  k.tapStation('griddle'); // late plate
  assert.equal(k.session.orders[0].stars, 2);
  assert.equal(k.session.orders[0].steps.length, 2);
});

test('only one dish cooks at a time at concurrency 0, two at concurrency 1', () => {
  const single = make({ recipes: ['toast', 'pancakes', 'mac'], seed: 3 });
  let k = single.k;
  runUntil(k, () => k.customers.filter((c) => c && c.state === 'waiting').length === 2
    || (k.customers.filter(Boolean).length === 2 && k.customers.every((c) => c.state !== 'arriving')));
  k.customers.forEach((c) => c && c.state === 'waiting' && k.tapCustomer(c.slot));
  const [a, b] = k.customers;
  // Force two different stations so the test is about concurrency, not luck.
  a.recipeId = 'toast';
  b.recipeId = 'pancakes';
  assert.equal(k.tapStation('toaster'), 'start');
  assert.equal(k.tapStation('griddle'), 'nope');

  const dual = make({ recipes: ['toast', 'pancakes', 'mac'], seed: 3, dials: { conc: 1 } });
  k = dual.k;
  runUntil(k, () => k.customers.filter(Boolean).length === 2 && k.customers.every((c) => c.state !== 'arriving'));
  k.customers.forEach((c) => c.state === 'waiting' && k.tapCustomer(c.slot));
  k.customers[0].recipeId = 'toast';
  k.customers[1].recipeId = 'pancakes';
  assert.equal(k.tapStation('toaster'), 'start');
  assert.equal(k.tapStation('griddle'), 'start');
  // Staggered: the two dishes do not become ready at the same moment.
  const t1 = k.stations.toaster.wait - k.stations.toaster.elapsed;
  const t2 = k.stations.griddle.wait - k.stations.griddle.elapsed;
  assert.ok(Math.abs(t1 - t2) >= TUNING.staggerGap - 0.01);
});

test('cooking needs a clean plate and ingredients', () => {
  const { k, events } = make();
  greetFirst(k);
  k.plates.clean = 0;
  assert.equal(k.tapStation('toaster'), 'need-plate');
  assert.ok(events.some((e) => e.type === 'need' && e.data.what === 'plate'));
  // Wash one.
  assert.equal(k.tapSink(), 'wash');
  run(k, TUNING.wash + 0.1, { keepBusy: true });
  assert.equal(k.plates.clean, 1);
  k.stations.toaster.stock = 0;
  assert.equal(k.tapStation('toaster'), 'need-stock');
  assert.equal(k.tapFridge(), 'restock');
  run(k, TUNING.restock + 0.1, { keepBusy: true });
  assert.equal(k.stations.toaster.stock, TUNING.maxStock);
  assert.equal(k.tapStation('toaster'), 'start');
});

test('busywork during the wait earns coins and a busy-bee bonus on a perfect dish', () => {
  const { k, events } = make();
  greetFirst(k);
  k.tapStation('toaster');
  const st = k.stations.toaster;
  k.tapSink();
  run(k, TUNING.wash + 0.1, { keepBusy: true });
  assert.equal(st.busy, 1);
  assert.equal(k.session.coins, TUNING.busyworkCoin);
  runUntil(k, () => st.phase === 'ready');
  k.tapStation('toaster');
  k.tapStation('toaster');
  const served = events.find((e) => e.type === 'served');
  assert.equal(served.data.busyBee, true);
  assert.equal(served.data.coins, TUNING.coins[3] + TUNING.busyBeeBonus);
});

test('spills appear while cooking and take several scrubs to wipe', () => {
  const { k } = make();
  greetFirst(k);
  k.tapStation('toaster');
  const spill = k.spawnSpill();
  assert.ok(spill);
  for (let i = 0; i < TUNING.spillHp - 1; i++) assert.equal(k.tapSpill(spill.id), 'scrub');
  assert.equal(k.tapSpill(spill.id), 'wiped');
  assert.equal(k.spills.length, 0);
});

test('there is always busywork available while a dish waits', () => {
  const { k } = make({ dials: { wait: 2 } });
  greetFirst(k);
  // Remove every chore.
  k.plates.dirty = 0;
  k.plates.clean = TUNING.totalPlates;
  for (const s of k.stationList()) s.stock = TUNING.maxStock + 1;
  k.tapStation('toaster');
  k.spawnTimer = 999;
  k.spillTimer = 999;
  run(k, 5, { keepBusy: true });
  assert.ok(k.availableBusywork().length > 0);
});

test('no input while a dish cooks is flagged as spacing out; being busy is not', () => {
  const idle = make({ dials: { wait: 3 } });
  greetFirst(idle.k);
  idle.k.tapStation('toaster');
  run(idle.k, TUNING.idleSpaceOut + 1);
  assert.equal(idle.k.session.spaceOuts, 1);
  assert.ok(idle.events.some((e) => e.type === 'nudge'));
  assert.ok(idle.events.some((e) => e.type === 'spaceout'));
  assert.equal(idle.k.stations.toaster.spacedOut, true);
  // Stays one event for one continuous idle stretch.
  run(idle.k, 5);
  assert.equal(idle.k.session.spaceOuts, 1);

  const busy = make({ dials: { wait: 3 } });
  greetFirst(busy.k);
  busy.k.tapStation('toaster');
  run(busy.k, TUNING.idleSpaceOut + 6, { keepBusy: true });
  assert.equal(busy.k.session.spaceOuts, 0);
  assert.ok(!busy.events.some((e) => e.type === 'spaceout'));
});

test('idle time with nothing cooking is not spacing out', () => {
  const { k } = make();
  run(k, 30);
  assert.equal(k.session.spaceOuts, 0);
});

test('an order that is never started makes the customer walk out with 0 stars', () => {
  const { k } = make();
  const c = greetFirst(k);
  run(k, TUNING.orderPatience + 1, { keepBusy: true });
  assert.equal(c.state, 'leaving');
  assert.equal(k.session.orders[0].stars, 0);
  assert.equal(k.session.orders[0].walkout, true);
});

test('eating customers leave a dirty plate and then free the slot', () => {
  const { k, events } = make();
  const c = greetFirst(k);
  k.tapStation('toaster');
  runUntil(k, () => k.stations.toaster.phase === 'ready');
  k.tapStation('toaster');
  k.tapStation('toaster');
  const dirtyBefore = k.plates.dirty;
  runUntil(k, () => c.state === 'leaving');
  assert.equal(k.plates.dirty, dirtyBefore + 1);
  assert.equal(c.mood, 'happy');
  runUntil(k, () => k.customers[c.slot] !== c);
  assert.ok(events.some((e) => e.type === 'customer-gone'));
});

test('split-kitchen mode leaves plates on the table to collect', () => {
  const { k } = make({ options: { collectPlates: true } });
  const c = greetFirst(k);
  k.tapStation('toaster');
  runUntil(k, () => k.stations.toaster.phase === 'ready');
  k.tapStation('toaster');
  k.tapStation('toaster');
  runUntil(k, () => c.state === 'leaving');
  assert.ok(k.tablePlates[c.slot]);
  const dirty = k.plates.dirty;
  assert.equal(k.tapPlate(c.slot), 'collected');
  assert.equal(k.plates.dirty, dirty + 1);
  assert.equal(k.tablePlates[c.slot], null);
});

test('interruption level: cooking customers ask for juice', () => {
  const { k, events } = make({ dials: { conc: 2, wait: 3 }, seed: 11 });
  const c = greetFirst(k);
  k.tapStation('toaster');
  c.juiceIn = 1; // force a request
  runUntil(k, () => !!c.juice, 5);
  assert.ok(events.some((e) => e.type === 'juice-request'));
  assert.equal(k.tapCustomer(c.slot), 'juice');
  assert.equal(c.juice, null);
  assert.equal(k.session.juice, 1);
});

test('closing time stops new customers and the kitchen empties', () => {
  const { k } = make();
  greetFirst(k);
  k.close();
  k.tapStation('toaster');
  runUntil(k, () => k.stations.toaster.phase === 'ready');
  k.tapStation('toaster');
  k.tapStation('toaster');
  // A second customer may already be inside; send them through too.
  runUntil(k, () => {
    for (const c of k.customers) {
      if (c && c.state === 'waiting') k.tapCustomer(c.slot);
      if (c && c.state === 'ordered') k.tapStation(RECIPES[c.recipeId].station);
    }
    for (const st of k.stationList()) if (st.phase === 'ready' || st.phase === 'quick') k.tapStation(st.id);
    return k.isDone();
  }, 200);
  assert.ok(k.isDone());
});

test('suggest never points at a cooking station unless timed hints are allowed', () => {
  const { k } = make();
  greetFirst(k);
  assert.deepEqual(k.suggest(), { type: 'station', id: 'toaster', blocking: true });
  k.tapStation('toaster');
  runUntil(k, () => k.stations.toaster.phase === 'ready');
  const plain = k.suggest();
  assert.ok(!plain || !(plain.type === 'station' && plain.id === 'toaster'));
  assert.deepEqual(k.suggest({ includeTimed: true }), { type: 'station', id: 'toaster', blocking: true });
});

test('a full simulated session with a diligent player earns mostly 3 stars', () => {
  const { k } = make({ recipes: ['toast', 'pancakes', 'mac'], seed: 42, dials: { cue: 1, wait: 1, conc: 1 } });
  let t = 0;
  while (t < 240) {
    k.update(STEP);
    t += STEP;
    for (const c of k.customers) if (c && c.state === 'waiting') k.tapCustomer(c.slot);
    for (const c of k.customers) if (c && c.state === 'ordered') k.tapStation(RECIPES[c.recipeId].station);
    for (const st of k.stationList()) {
      if (st.phase === 'ready' || st.phase === 'quick' || st.phase === 'late') k.tapStation(st.id);
    }
    if (k.plates.dirty > 0) k.tapSink();
    if (k.stationList().some((s) => s.stock < 2)) k.tapFridge();
    for (const s of [...k.spills]) k.tapSpill(s.id);
  }
  assert.ok(k.session.orders.length >= 6, `orders: ${k.session.orders.length}`);
  assert.ok(k.session.orders.every((o) => o.stars === 3));
  assert.equal(k.session.spaceOuts, 0);
  assert.ok(k.session.coins > 0);
});
