// The kitchen simulation. Pure logic: no DOM, no audio, no wall-clock time.
// The view calls update(dt) with game-clock seconds, sends taps as intents,
// and listens to events to play animations and sounds.

import { RECIPES, stationsFor, stepTiming } from './recipes.js';
import { makeRng } from './rng.js';

export const TUNING = {
  arrive: 1.3, // seconds for a customer to walk up before they can be greeted
  eat: 4.2,
  leave: 1.2,
  wash: 0.8,
  restock: 0.7,
  peekShow: 1.6, // how long a peek shows the cooking progress
  peekLock: 1.5, // minimum gap between peeks on one station
  burntAbandon: 20, // a burnt dish left this long is thrown away
  greetPatience: 45,
  orderPatience: 70,
  idleNudge: 6, // no input this long while cooking → gentle nudge
  idleSpaceOut: 10, // no input this long while cooking → spacing-out event
  juiceTimeout: 18,
  tablePlateAuto: 15,
  maxStock: 3,
  startStock: 2,
  totalPlates: 5,
  startDirty: 2,
  spillHp: 3,
  staggerGap: 3, // keep two dishes from becoming ready within this many seconds
  coins: { 3: 6, 2: 4, 1: 2, 0: 0 },
  busyBeeBonus: 2,
  busyworkCoin: 1,
};

const COOKING_PHASES = new Set(['wait', 'ready', 'late']);

function newStation(id) {
  return {
    id,
    phase: 'idle', // idle | wait | ready | late | quick | burnt
    recipeId: null,
    step: 0,
    elapsed: 0,
    wait: 0,
    perfect: 0,
    grace: 0,
    customerId: null,
    results: [],
    peeks: 0,
    peekUntil: -1,
    lockUntil: -1,
    busy: 0,
    spacedOut: false,
    burntFor: 0,
    stock: TUNING.startStock,
  };
}

export class Kitchen {
  /**
   * @param {object} o
   * @param {{cue:number, wait:number, conc:number}} o.dials
   * @param {string[]} o.recipes   unlocked recipe ids
   * @param {object} [o.rng]
   * @param {number} [o.seed]
   * @param {object} [o.options]   { collectPlates, nudge, spillSpots }
   */
  constructor({ dials, recipes, rng, seed, options = {} }) {
    this.rng = rng || makeRng(seed ?? Date.now());
    this.dials = { cue: 0, wait: 0, conc: 0, ...dials };
    this.recipes = recipes.filter((id) => RECIPES[id]);
    if (!this.recipes.length) throw new Error('Kitchen needs at least one recipe');
    this.options = { collectPlates: false, nudge: true, spillSpots: 4, ...options };

    this.t = 0;
    this.nextId = 1;
    this.listeners = new Set();
    this.stations = {};
    for (const id of stationsFor(this.recipes)) this.stations[id] = newStation(id);

    this.customers = [null, null];
    this.tablePlates = [null, null];
    this.plates = { clean: TUNING.totalPlates - TUNING.startDirty, dirty: TUNING.startDirty };
    this.sink = { washing: 0 };
    this.fridge = { busy: 0, target: null };
    this.spills = [];
    this.spawnTimer = 0.8;
    this.spillTimer = this.rng.range(7, 12);
    this.noWorkFor = 0;

    this.lastInput = 0;
    this.nudged = false;
    this.spaced = false;
    this.closing = false;

    this.session = {
      coins: 0,
      stars: 0,
      orders: [],
      spaceOuts: 0,
      busywork: 0,
      peeks: 0,
      missedCustomers: 0,
      juice: 0,
      cookingTime: 0,
    };
  }

  // ---------------------------------------------------------------- events

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(type, data = {}) {
    for (const fn of this.listeners) fn(type, data);
  }

  // --------------------------------------------------------------- queries

  maxConcurrent() {
    return this.dials.conc >= 1 ? 2 : 1;
  }

  stationList() {
    return Object.values(this.stations);
  }

  activeCount() {
    return this.stationList().filter((s) => s.phase !== 'idle').length;
  }

  isCooking() {
    return this.stationList().some((s) => COOKING_PHASES.has(s.phase));
  }

  customerById(id) {
    return this.customers.find((c) => c && c.id === id) || null;
  }

  /** Progress 0..1 of the current wait on a station. */
  progress(st) {
    if (!COOKING_PHASES.has(st.phase) || st.wait <= 0) return 0;
    return Math.max(0, Math.min(1, st.elapsed / st.wait));
  }

  /** Progress 0..1 through the grace period (how close to burning). */
  danger(st) {
    if (st.phase === 'late') return Math.min(1, (st.elapsed - st.wait - st.perfect) / st.grace);
    return st.phase === 'burnt' ? 1 : 0;
  }

  isPeeking(st) {
    return this.t < st.peekUntil;
  }

  nextAction(st) {
    if (st.phase === 'idle' || !st.recipeId) return null;
    if (st.phase === 'burnt') return 'serve';
    return RECIPES[st.recipeId].steps[st.step]?.action ?? null;
  }

  /** Clearly visible busywork available right now (used to keep the player busy). */
  availableBusywork() {
    const out = [];
    if (this.customers.some((c) => c && c.state === 'waiting')) out.push('greet');
    if (this.plates.dirty > 0) out.push('wash');
    if (this.spills.length) out.push('spill');
    // A nearly-full shelf is not an obvious job, so it does not count here.
    if (this.stationList().some((s) => s.stock <= 1)) out.push('restock');
    if (this.customers.some((c) => c && c.juice)) out.push('juice');
    if (this.tablePlates.some(Boolean)) out.push('collect');
    return out;
  }

  /**
   * The most useful next tap, for the tutorial hand and "stuck" helper.
   * With includeTimed=false it never points at a cooking station, so it
   * cannot be used as a timing cue.
   */
  suggest({ includeTimed = false } = {}) {
    const stations = this.stationList();
    const must = (o) => ({ ...o, blocking: true });
    const may = (o) => ({ ...o, blocking: false });
    if (includeTimed) {
      const urgent = stations.find((s) => s.phase === 'late') || stations.find((s) => s.phase === 'ready');
      if (urgent) return must({ type: 'station', id: urgent.id });
    }
    const burnt = stations.find((s) => s.phase === 'burnt');
    if (burnt) return must({ type: 'station', id: burnt.id });
    const quick = stations.find((s) => s.phase === 'quick');
    if (quick) return must({ type: 'station', id: quick.id });
    const juice = this.customers.find((c) => c && c.juice);
    if (juice) return may({ type: 'customer', slot: juice.slot });
    const waiting = this.customers.find((c) => c && c.state === 'waiting');
    if (waiting) return must({ type: 'customer', slot: waiting.slot });
    if (this.activeCount() < this.maxConcurrent()) {
      const ordered = this.customers
        .filter((c) => c && c.state === 'ordered')
        .sort((a, b) => a.orderedAt - b.orderedAt)
        .find((c) => this.stations[RECIPES[c.recipeId].station].phase === 'idle');
      if (ordered) {
        const st = this.stations[RECIPES[ordered.recipeId].station];
        if (this.plates.clean <= 0) return must({ type: 'sink' });
        if (st.stock <= 0) return must({ type: 'fridge' });
        return must({ type: 'station', id: st.id });
      }
    }
    const plateSlot = this.tablePlates.findIndex(Boolean);
    if (plateSlot >= 0) return may({ type: 'plate', slot: plateSlot });
    if (this.plates.dirty > 0 && this.sink.washing <= 0) return may({ type: 'sink' });
    if (this.spills.length) return may({ type: 'spill', id: this.spills[0].id });
    if (this.fridge.busy <= 0 && stations.some((s) => s.stock < TUNING.maxStock)) return may({ type: 'fridge' });
    return null;
  }

  /** True once closing time has been called and the kitchen has emptied. */
  isDone() {
    return this.closing && this.customers.every((c) => !c) && this.activeCount() === 0;
  }

  // --------------------------------------------------------------- intents

  setDials(dials) {
    this.dials = { ...this.dials, ...dials };
  }

  close() {
    this.closing = true;
  }

  noteInput() {
    this.lastInput = this.t;
    this.nudged = false;
    this.spaced = false;
  }

  tapCustomer(slot) {
    this.noteInput();
    const c = this.customers[slot];
    if (!c) return 'none';
    if (c.juice) return this.serveJuice(c);
    if (c.state === 'waiting') {
      c.state = 'ordered';
      c.orderedAt = this.t;
      c.patience = TUNING.orderPatience;
      this.creditBusywork(0);
      this.emit('greeted', { slot, customer: c, recipeId: c.recipeId });
      return 'greeted';
    }
    this.emit('poke', { slot, customer: c });
    return 'poke';
  }

  tapJuice() {
    this.noteInput();
    const c = this.customers.filter((x) => x && x.juice).sort((a, b) => b.juice.t - a.juice.t)[0];
    if (!c) {
      this.emit('nope', { target: 'juice', reason: 'no-request' });
      return 'nope';
    }
    return this.serveJuice(c);
  }

  tapStation(id) {
    this.noteInput();
    const st = this.stations[id];
    if (!st) return 'none';
    switch (st.phase) {
      case 'idle':
        return this.tryStart(st);
      case 'wait':
        if (this.t < st.lockUntil) return 'locked';
        st.peeks++;
        this.session.peeks++;
        st.peekUntil = this.t + TUNING.peekShow;
        st.lockUntil = this.t + TUNING.peekLock;
        this.emit('peek', { station: id, progress: this.progress(st) });
        return 'peek';
      case 'ready':
      case 'late':
        return this.doTimed(st);
      case 'quick':
        return this.doQuick(st);
      case 'burnt':
        return this.serve(st);
      default:
        return 'none';
    }
  }

  tapSink() {
    this.noteInput();
    if (this.sink.washing > 0) return 'busy';
    if (this.plates.dirty <= 0) {
      this.emit('nope', { target: 'sink', reason: 'no-dirty' });
      return 'nope';
    }
    this.sink.washing = TUNING.wash;
    this.emit('wash-start', {});
    return 'wash';
  }

  tapFridge() {
    this.noteInput();
    if (this.fridge.busy > 0) return 'busy';
    const low = this.stationList()
      .filter((s) => s.stock < TUNING.maxStock)
      .sort((a, b) => a.stock - b.stock)[0];
    if (!low) {
      this.emit('nope', { target: 'fridge', reason: 'full' });
      return 'nope';
    }
    this.fridge.busy = TUNING.restock;
    this.fridge.target = low.id;
    this.emit('restock-start', { station: low.id });
    return 'restock';
  }

  tapSpill(id) {
    this.noteInput();
    const i = this.spills.findIndex((s) => s.id === id);
    if (i < 0) return 'none';
    const spill = this.spills[i];
    spill.hp--;
    if (spill.hp > 0) {
      this.emit('scrub', { id, hp: spill.hp, spot: spill.spot });
      return 'scrub';
    }
    this.spills.splice(i, 1);
    this.creditBusywork(TUNING.busyworkCoin, { type: 'spill', id });
    this.emit('wiped', { id, spot: spill.spot });
    return 'wiped';
  }

  tapPlate(slot) {
    this.noteInput();
    if (!this.tablePlates[slot]) return 'none';
    this.collectPlate(slot, true);
    return 'collected';
  }

  // --------------------------------------------------------------- cooking

  tryStart(st) {
    const cust = this.customers
      .filter((c) => c && c.state === 'ordered' && RECIPES[c.recipeId].station === st.id)
      .sort((a, b) => a.orderedAt - b.orderedAt)[0];
    if (!cust) {
      this.emit('nope', { target: 'station', station: st.id, reason: 'no-order' });
      return 'nope';
    }
    if (this.activeCount() >= this.maxConcurrent()) {
      this.emit('nope', { target: 'station', station: st.id, reason: 'busy' });
      return 'nope';
    }
    if (this.plates.clean <= 0) {
      this.emit('need', { what: 'plate', station: st.id });
      return 'need-plate';
    }
    if (st.stock <= 0) {
      this.emit('need', { what: 'stock', station: st.id });
      return 'need-stock';
    }
    const recipe = RECIPES[cust.recipeId];
    this.plates.clean--;
    st.stock--;
    st.recipeId = recipe.id;
    st.customerId = cust.id;
    st.step = 0;
    st.results = [];
    st.peeks = 0;
    st.busy = 0;
    st.spacedOut = false;
    st.burntFor = 0;
    st.peekUntil = -1;
    st.lockUntil = -1;
    cust.state = 'cooking';
    if (this.dials.conc >= 2 && this.rng.chance(0.75)) cust.juiceIn = this.rng.range(5, 12);
    this.emit('cook-start', { station: st.id, recipeId: recipe.id, action: recipe.start, slot: cust.slot });
    this.beginStep(st);
    return 'start';
  }

  beginStep(st) {
    const step = RECIPES[st.recipeId].steps[st.step];
    if (!step) return this.serve(st);
    if (!step.timed) {
      st.phase = 'quick';
      st.elapsed = 0;
      this.emit('quick', { station: st.id, action: step.action });
      return 'quick';
    }
    const timing = stepTiming(this.dials.wait, step, this.rng);
    // Stagger: keep this dish from becoming ready at the same moment as another.
    for (const other of this.stationList()) {
      if (other === st || other.phase !== 'wait') continue;
      const otherReadyIn = other.wait - other.elapsed;
      if (Math.abs(otherReadyIn - timing.wait) < TUNING.staggerGap) {
        timing.wait = otherReadyIn + TUNING.staggerGap;
      }
    }
    st.phase = 'wait';
    st.elapsed = 0;
    st.wait = timing.wait;
    st.perfect = timing.perfect;
    st.grace = timing.grace;
    return 'wait';
  }

  doTimed(st) {
    const step = RECIPES[st.recipeId].steps[st.step];
    const outcome = st.phase === 'ready' ? 'perfect' : 'late';
    const rt = Math.max(0, st.elapsed - st.wait);
    st.results.push({ action: step.action, outcome, rt });
    this.emit('step', { station: st.id, action: step.action, outcome, rt, step: st.step, recipeId: st.recipeId });
    st.step++;
    st.peekUntil = -1;
    this.beginStep(st);
    return outcome;
  }

  doQuick(st) {
    const step = RECIPES[st.recipeId].steps[st.step];
    st.results.push({ action: step.action, outcome: 'quick', rt: null });
    this.emit('step', { station: st.id, action: step.action, outcome: 'quick', rt: null, step: st.step, recipeId: st.recipeId });
    st.step++;
    this.beginStep(st);
    return 'quick';
  }

  starsFor(results) {
    if (results.some((r) => r.outcome === 'burnt')) return 1;
    if (results.some((r) => r.outcome === 'late')) return 2;
    return 3;
  }

  buildOrder(st, stars, extra = {}) {
    const rts = st.results.filter((r) => r.rt != null).map((r) => r.rt);
    return {
      recipeId: st.recipeId,
      stars,
      steps: st.results.map((r) => ({ ...r })),
      rt: rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null,
      missed: st.results.filter((r) => r.outcome === 'burnt').length,
      peeks: st.peeks,
      busy: st.busy,
      spacedOut: st.spacedOut,
      dials: { ...this.dials },
      t: this.t,
      ...extra,
    };
  }

  serve(st) {
    const cust = this.customerById(st.customerId);
    const stars = this.starsFor(st.results);
    const busyBee = stars === 3 && st.busy >= 1;
    const coins = TUNING.coins[stars] + (busyBee ? TUNING.busyBeeBonus : 0);
    const order = this.buildOrder(st, stars, { busyBee, coins });
    this.session.orders.push(order);
    this.session.stars += stars;
    this.session.coins += coins;
    const stationId = st.id;
    const recipeId = st.recipeId;
    this.resetStation(st);
    if (cust) {
      cust.state = 'eating';
      cust.timer = TUNING.eat;
      cust.stars = stars;
      cust.dish = { recipeId, burnt: stars === 1 };
      cust.juice = null;
      cust.juiceIn = null;
    }
    this.emit('served', { station: stationId, slot: cust ? cust.slot : null, order, stars, coins, busyBee, burnt: stars === 1 });
    return 'served';
  }

  abandon(st) {
    const cust = this.customerById(st.customerId);
    const order = this.buildOrder(st, 0, { abandoned: true, coins: 0 });
    this.session.orders.push(order);
    const stationId = st.id;
    this.resetStation(st);
    this.plates.dirty++; // the ruined dish still leaves a plate to wash
    if (cust) this.sendAway(cust, 'sad');
    this.emit('abandoned', { station: stationId, slot: cust ? cust.slot : null, order });
  }

  resetStation(st) {
    st.phase = 'idle';
    st.recipeId = null;
    st.customerId = null;
    st.step = 0;
    st.elapsed = 0;
    st.wait = 0;
    st.results = [];
    st.peekUntil = -1;
    st.lockUntil = -1;
    st.burntFor = 0;
  }

  // ------------------------------------------------------------- customers

  spawnCustomer(slot) {
    const other = this.customers[1 - slot];
    let choices = this.recipes;
    if (other && this.maxConcurrent() > 1 && this.rng.chance(0.85)) {
      const taken = RECIPES[other.recipeId].station;
      const different = this.recipes.filter((r) => RECIPES[r].station !== taken);
      if (different.length) choices = different;
    }
    const c = {
      id: this.nextId++,
      slot,
      look: this.rng.int(0, 9999),
      state: 'arriving', // arriving | waiting | ordered | cooking | eating | leaving
      recipeId: this.rng.pick(choices),
      timer: TUNING.arrive,
      patience: TUNING.greetPatience,
      orderedAt: 0,
      juice: null,
      juiceIn: null,
      mood: null,
      stars: null,
      dish: null,
    };
    this.customers[slot] = c;
    this.emit('customer-arrive', { slot, customer: c });
    return c;
  }

  sendAway(c, mood) {
    c.state = 'leaving';
    c.timer = TUNING.leave;
    c.mood = mood;
    c.juice = null;
    c.juiceIn = null;
    this.emit('customer-leave', { slot: c.slot, customer: c, mood });
  }

  serveJuice(c) {
    c.juice = null;
    this.session.juice++;
    this.creditBusywork(TUNING.busyworkCoin, { type: 'juice', slot: c.slot });
    this.emit('juice-served', { slot: c.slot, customer: c });
    return 'juice';
  }

  collectPlate(slot, byPlayer) {
    this.tablePlates[slot] = null;
    this.plates.dirty++;
    if (byPlayer) this.creditBusywork(TUNING.busyworkCoin, { type: 'plate', slot });
    this.emit('plate-collected', { slot, byPlayer });
  }

  creditBusywork(coins, source = null) {
    this.session.busywork++;
    for (const st of this.stationList()) if (st.phase === 'wait') st.busy++;
    if (coins > 0) {
      this.session.coins += coins;
      this.emit('coins', { amount: coins, source });
    }
  }

  // ---------------------------------------------------------------- update

  update(dt) {
    if (!(dt > 0)) return;
    this.t += dt;
    this.updateCustomers(dt);
    this.updateSpawns(dt);
    this.updateStations(dt);
    this.updateChores(dt);
    this.updateAttention(dt);
  }

  updateCustomers(dt) {
    const capacityFree = this.activeCount() < this.maxConcurrent();
    for (let slot = 0; slot < this.customers.length; slot++) {
      const c = this.customers[slot];
      if (!c) continue;
      switch (c.state) {
        case 'arriving':
          c.timer -= dt;
          if (c.timer <= 0) {
            c.state = 'waiting';
            this.emit('customer-ready', { slot, customer: c });
          }
          break;
        case 'waiting':
          c.patience -= dt;
          if (c.patience <= 0) {
            this.session.missedCustomers++;
            this.sendAway(c, 'sad');
            this.emit('customer-missed', { slot, customer: c });
          }
          break;
        case 'ordered': {
          // Patience only runs while the player could actually start this dish.
          const st = this.stations[RECIPES[c.recipeId].station];
          if (capacityFree && st.phase === 'idle') c.patience -= dt;
          if (c.patience <= 0) {
            const order = {
              recipeId: c.recipeId, stars: 0, steps: [], rt: null, missed: 0, peeks: 0, busy: 0,
              spacedOut: false, dials: { ...this.dials }, t: this.t, abandoned: true, walkout: true, coins: 0,
            };
            this.session.orders.push(order);
            this.sendAway(c, 'sad');
            this.emit('abandoned', { station: null, slot, order });
          }
          break;
        }
        case 'cooking':
          if (c.juice) {
            c.juice.t -= dt;
            if (c.juice.t <= 0) {
              c.juice = null;
              this.emit('juice-timeout', { slot, customer: c });
            }
          } else if (c.juiceIn != null) {
            c.juiceIn -= dt;
            if (c.juiceIn <= 0) {
              c.juiceIn = null;
              c.juice = { t: TUNING.juiceTimeout };
              this.emit('juice-request', { slot, customer: c });
            }
          }
          break;
        case 'eating':
          c.timer -= dt;
          if (c.timer <= 0) {
            const mood = c.stars >= 3 ? 'happy' : c.stars === 2 ? 'ok' : 'grumpy';
            this.sendAway(c, mood);
            if (this.options.collectPlates) {
              this.tablePlates[slot] = { t: TUNING.tablePlateAuto };
              this.emit('plate-left', { slot });
            } else {
              this.plates.dirty++;
              this.emit('plate-dirty', { slot });
            }
          }
          break;
        case 'leaving':
          c.timer -= dt;
          if (c.timer <= 0) {
            this.customers[slot] = null;
            this.emit('customer-gone', { slot, customer: c });
          }
          break;
      }
    }
    for (let slot = 0; slot < this.tablePlates.length; slot++) {
      const p = this.tablePlates[slot];
      if (!p) continue;
      p.t -= dt;
      if (p.t <= 0) this.collectPlate(slot, false);
    }
  }

  updateSpawns(dt) {
    if (this.closing) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const slot = [0, 1].find((s) => !this.customers[s] && !this.tablePlates[s]);
    if (slot === undefined) {
      this.spawnTimer = 1.5; // full house: look again shortly, so a freed seat is not refilled instantly
      return;
    }
    this.spawnCustomer(slot);
    this.spawnTimer = this.dials.conc >= 1 ? this.rng.range(3, 7) : this.rng.range(5, 9);
  }

  updateStations(dt) {
    for (const st of this.stationList()) {
      if (COOKING_PHASES.has(st.phase)) {
        st.elapsed += dt;
        if (st.phase === 'wait' && st.elapsed >= st.wait) {
          st.phase = 'ready';
          this.emit('ready', { station: st.id, action: this.nextAction(st) });
        }
        if (st.phase === 'ready' && st.elapsed >= st.wait + st.perfect) {
          st.phase = 'late';
          this.emit('late', { station: st.id, action: this.nextAction(st) });
        }
        if (st.phase === 'late' && st.elapsed >= st.wait + st.perfect + st.grace) {
          const step = RECIPES[st.recipeId].steps[st.step];
          st.results.push({ action: step.action, outcome: 'burnt', rt: null });
          st.phase = 'burnt';
          st.burntFor = 0;
          this.emit('burnt', { station: st.id, recipeId: st.recipeId, spacedOut: st.spacedOut });
        }
      } else if (st.phase === 'burnt') {
        st.burntFor += dt;
        if (st.burntFor >= TUNING.burntAbandon) this.abandon(st);
      }
    }
  }

  updateChores(dt) {
    if (this.sink.washing > 0) {
      this.sink.washing -= dt;
      if (this.sink.washing <= 0) {
        this.sink.washing = 0;
        if (this.plates.dirty > 0) {
          this.plates.dirty--;
          this.plates.clean++;
          this.creditBusywork(TUNING.busyworkCoin, { type: 'sink' });
          this.emit('washed', { clean: this.plates.clean, dirty: this.plates.dirty });
        }
      }
    }
    if (this.fridge.busy > 0) {
      this.fridge.busy -= dt;
      if (this.fridge.busy <= 0) {
        this.fridge.busy = 0;
        const st = this.stations[this.fridge.target];
        this.fridge.target = null;
        if (st) {
          st.stock = TUNING.maxStock;
          this.creditBusywork(TUNING.busyworkCoin, { type: 'fridge' });
          this.emit('restocked', { station: st.id });
        }
      }
    }

    const cooking = this.isCooking();
    const maxSpills = this.dials.conc >= 2 ? 3 : 2;
    if (cooking) {
      this.spillTimer -= dt;
      if (this.spillTimer <= 0) {
        if (this.spills.length < maxSpills) this.spawnSpill();
        this.spillTimer = this.dials.conc >= 2 ? this.rng.range(6, 11) : this.rng.range(9, 16);
      }
      // Always leave the player something legitimate to do while a dish cooks.
      const waiting = this.stationList().some((s) => s.phase === 'wait');
      if (waiting && this.availableBusywork().length === 0 && this.sink.washing <= 0 && this.fridge.busy <= 0) {
        this.noWorkFor += dt;
        if (this.noWorkFor > 4) {
          this.spawnSpill();
          this.noWorkFor = 0;
        }
      } else {
        this.noWorkFor = 0;
      }
    }
  }

  spawnSpill() {
    const used = new Set(this.spills.map((s) => s.spot));
    const free = [];
    for (let i = 0; i < this.options.spillSpots; i++) if (!used.has(i)) free.push(i);
    if (!free.length) return null;
    const spill = { id: this.nextId++, spot: this.rng.pick(free), hp: TUNING.spillHp, kind: this.rng.int(0, 2) };
    this.spills.push(spill);
    this.emit('spill', { spill });
    return spill;
  }

  updateAttention(dt) {
    if (!this.isCooking()) {
      // Idle time only counts while something is cooking.
      this.lastInput = Math.max(this.lastInput, this.t - TUNING.idleNudge * 0.5);
      return;
    }
    this.session.cookingTime += dt;
    const idle = this.t - this.lastInput;
    if (!this.nudged && idle >= TUNING.idleNudge) {
      this.nudged = true;
      if (this.options.nudge) this.emit('nudge', {});
    }
    if (!this.spaced && idle >= TUNING.idleSpaceOut) {
      this.spaced = true;
      this.session.spaceOuts++;
      for (const st of this.stationList()) if (COOKING_PHASES.has(st.phase)) st.spacedOut = true;
      // Tuning: bring the next bit of busywork forward to pull attention back.
      this.spillTimer = Math.min(this.spillTimer, 2);
      this.emit('spaceout', {});
    }
  }
}
