// The playable kitchen: draws the scene for the chosen layout, turns taps into
// kitchen intents, and turns kitchen events into animation and sound.
// There is no text anywhere in here – only pictures, motion and audio.

import { Kitchen } from '../engine/kitchen.js';
import { GameClock } from '../engine/clock.js';
import { dialsFor, layoutFor, recordOrder, masteryProgress } from '../engine/difficulty.js';
import { unlockedRecipes } from '../engine/catalog.js';
import { dayStatus, summarizeSession, applySession } from '../engine/stats.js';
import { getLayout } from './layouts.js';
import { el, C } from './art/common.js';
import { foodIcon, actionIcon, ingredientIcon } from './art/food.js';
import { stationSvg, visualState, visualKey } from './art/stations.js';
import { customerSvg, chefSvg, SPECIES } from './art/animals.js';
import { fridgeSvg, sinkSvg, jugSvg, spillSvg, handSvg, petSvg, clockSvg, decorSvg, icon, clothSvg } from './art/props.js';
import { scene1, scene2, scene3, tableSvg, pawsSvg, windowSvg, skyAt } from './art/scene.js';
import { Fx } from './fx.js';

const CUE_LOOP = [1, 0.7, 0.35, 0];
const PULSES = ['bounce', 'shake', 'peek', 'act', 'act-flip', 'hop', 'look', 'joy', 'pop-in'];
const COOKING = new Set(['wait', 'ready', 'late']);
const center = (r) => ({ x: r.x + (r.w ?? r.size) / 2, y: r.y + (r.h ?? r.size) / 2 });

export class KitchenScreen {
  constructor(app, { profile }) {
    this.app = app;
    this.profile = profile;
    this.sound = app.sound;
    const globals = app.store.globals;
    this.dials = dialsFor(profile.level, profile.settings.override);
    this.layout = getLayout(layoutFor(this.dials, profile.settings.layout));
    const day = dayStatus(profile, globals);
    this.sessionLength = app.debug.sessionSec || day.sessionSec || globals.goalMin * 60;
    this.kitchen = new Kitchen({
      dials: this.dials,
      recipes: unlockedRecipes(profile),
      seed: app.debug.seed,
      options: {
        collectPlates: this.layout.collectPlates,
        nudge: this.nudgeAllowed(),
        spillSpots: this.layout.spills.length,
      },
    });
    this.tutorial = !profile.tutorialDone;
    this.tutorialServed = 0;
    this.sessionTime = 0;
    this.closingFor = 0;
    this.levelStart = profile.level;
    this.levelUps = 0;
    this.finished = false;
    this.timers = [];
    this.shownStars = 0;
    this.shownCoins = profile.coins;
    this.idleReal = 0;
    this.botTimer = 0;
    this.skyTimer = 0;
    this.stationViews = {};
    this.custViews = [];
    this.spillViews = new Map();
  }

  nudgeAllowed() {
    const pref = this.profile.settings.nudge;
    return pref === 'on' || (pref !== 'off' && this.dials.cue <= 1);
  }

  // ------------------------------------------------------------------ build

  mount() {
    const L = this.layout;
    const root = (this.root = el('div', `screen kitchen layout-${L.id}`));
    root.dataset.cue = this.dials.cue;
    this.buildScene();
    this.buildDecor();
    this.buildCustomers();
    this.buildProps();
    this.buildStations();
    this.buildChef();
    this.buildHud();
    this.fxLayer = el('div', 'layer fx-layer');
    root.append(this.fxLayer);
    this.fx = new Fx(this.fxLayer);
    this.hand = el('div', 'hand hidden', handSvg());
    root.append(this.hand);
    this.overlay = el('div', 'overlay hidden');
    root.append(this.overlay);

    this.off = this.kitchen.on((t, d) => this.onEvent(t, d));
    this.clock = new GameClock((dt) => this.tick(dt));
    this.clock.speed = this.app.debug.speed || 1;
    this.onVisibility = () => {
      if (document.hidden) {
        this.clock.pause('hidden');
        this.sound.hold(true);
      } else {
        this.clock.resume('hidden');
        if (!this.clock.paused) this.sound.hold(false);
      }
    };
    this.onPageHide = () => this.finish({ silent: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
    this.sound.startMusic();
    this.renderMastery();
    this.render(0);
    this.clock.start();
    if (this.app.debug.expose) globalThis.__lc = { view: this, kitchen: this.kitchen, clock: this.clock };
    return root;
  }

  destroy() {
    this.clock?.stop();
    this.off?.();
    this.sound.stopAllLoops();
    this.sound.stopMusic();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onPageHide);
  }

  place(node, r, z) {
    node.style.left = `${r.x}px`;
    node.style.top = `${r.y}px`;
    node.style.width = `${r.w ?? r.size}px`;
    node.style.height = `${r.h ?? r.size}px`;
    if (z != null) node.style.zIndex = z;
    return node;
  }

  addLayer(html, z) {
    const node = el('div', 'layer', html);
    node.style.zIndex = z;
    this.root.append(node);
    return node;
  }

  buildScene() {
    const L = this.layout;
    const theme = this.profile.equipped.wall;
    const n = this.kitchen.stationList().length;
    this.stationRects = L.stations(n);
    if (L.id === 1) {
      const s = scene1(theme);
      this.addLayer(s.wall, 0);
      this.addLayer(s.counter, L.z.counter);
      this.addLayer(s.worktop, L.z.worktop);
    } else if (L.id === 2) {
      const s = scene2(theme, this.stationRects);
      this.addLayer(s.wall, 0);
      for (const t of L.tables) {
        const table = el('div', 'abs table', tableSvg(C.red));
        this.root.append(this.place(table, t, L.z.counter));
      }
    } else {
      const s = scene3(theme);
      this.addLayer(s.wall, 0);
      this.addLayer(s.hatch, L.z.counter);
    }
  }

  buildDecor() {
    const L = this.layout;
    const d = L.decor;
    const add = (cls, html, r, z = 1) => {
      if (!r || !r.w) return null;
      const node = el('div', `abs decor ${cls}`, html);
      this.root.append(this.place(node, r, z));
      return node;
    };
    this.windowEl = add('window', windowSvg(), d.window);
    this.clockEl = add('clock', clockSvg(), d.clock);
    this.clockHand = this.clockEl?.querySelector('.clock-hand');
    const on = this.profile.equipped.decor;
    for (const id of ['picture', 'bunting', 'lights', 'plant', 'fishbowl']) {
      if (on.includes(id)) add(`decor-${id}`, decorSvg(id), d[id], id === 'plant' || id === 'fishbowl' ? L.z.props + 1 : 1);
    }
    if (this.profile.equipped.pet) {
      this.petEl = add('pet', petSvg(this.profile.equipped.pet), L.pet, L.z.pet);
    }
  }

  buildCustomers() {
    const L = this.layout;
    // Customers live in a clipped layer so they can slide away behind the counter.
    const clip = el('div', 'cust-clip');
    clip.style.height = `${L.customerClip || 800}px`;
    clip.style.zIndex = L.z.customers;
    this.root.append(clip);
    for (let i = 0; i < 2; i++) {
      const node = el('div', 'abs customer out', '<div class="cust-art"></div>');
      clip.append(this.place(node, L.customers[i]));
      const bubble = el('div', `abs bubble tail-${L.bubbles[i].tail} hidden`, '<div class="bubble-food"></div>');
      this.root.append(this.place(bubble, L.bubbles[i], 12));
      const jb = el('div', 'abs jbubble hidden', foodIcon('juice'));
      this.root.append(this.place(jb, L.juiceBubbles[i], 12));
      const dish = el('div', 'abs dish hidden');
      this.root.append(this.place(dish, L.dishes[i], L.z.counterItems));
      const tap = () => this.tapCustomer(i);
      node.addEventListener('pointerdown', tap);
      bubble.addEventListener('pointerdown', tap);
      jb.addEventListener('pointerdown', tap);
      dish.addEventListener('pointerdown', () => this.tapPlate(i));
      this.custViews.push({ el: node, art: node.firstChild, bubble, jb, dish, expr: null, look: null, rect: L.customers[i] });
    }
  }

  buildProps() {
    const L = this.layout;
    const z = L.z.props;
    this.fridgeEl = el('div', 'abs prop fridge', `<div class="prop-art">${fridgeSvg(false)}</div><div class="need hidden"></div>`);
    this.root.append(this.place(this.fridgeEl, L.fridge, z));
    this.fridgeEl.addEventListener('pointerdown', () => this.tapFridge());
    this.sinkEl = el('div', 'abs prop sink', `<div class="prop-art"></div><div class="need hidden">${icon('star')}</div>`);
    this.root.append(this.place(this.sinkEl, L.sink, z));
    this.sinkEl.addEventListener('pointerdown', () => this.tapSink());
    this.sinkEl.querySelector('.need').innerHTML = `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="56" rx="42" ry="16" fill="#fff" stroke="#4a2b17" stroke-width="5"/><ellipse cx="50" cy="55" rx="28" ry="9" fill="#e3ebf2"/></svg>`;
    this.jugEl = el('div', 'abs prop jug', jugSvg());
    this.root.append(this.place(this.jugEl, L.juice, L.z.counterItems));
    this.jugEl.addEventListener('pointerdown', () => this.tapJug());
    this.jugEl.classList.toggle('hidden', this.dials.conc < 2);
    this.sinkKey = '';
    this.fridgeOpen = false;
  }

  buildStations() {
    const L = this.layout;
    this.kitchen.stationList().forEach((st, i) => {
      const r = this.stationRects[i];
      const node = el('div', 'abs station', `
        <div class="st-glow"></div>
        <div class="st-art"></div>
        <div class="st-smoke"><i></i><i></i><i></i><i></i></div>
        <div class="st-shimmer"><i></i><i></i><i></i></div>
        <div class="st-ring"><div class="st-ring-pie"></div></div>
        <div class="st-bubble"></div>
        <div class="st-stock"><span class="ing">${ingredientIcon(st.id)}</span><i></i><i></i><i></i></div>`);
      node.dataset.id = st.id;
      node.dataset.phase = 'idle';
      node.style.setProperty('--s', Math.max(0.72, Math.min(1, r.w / 240)).toFixed(2));
      this.root.append(this.place(node, r, L.z.stations));
      node.addEventListener('pointerdown', () => this.tapStation(st.id));
      this.stationViews[st.id] = {
        el: node,
        rect: r,
        art: node.querySelector('.st-art'),
        ring: node.querySelector('.st-ring'),
        pie: node.querySelector('.st-ring-pie'),
        bubble: node.querySelector('.st-bubble'),
        pips: [...node.querySelectorAll('.st-stock i')],
        stockEl: node.querySelector('.st-stock'),
        key: null,
        phase: 'idle',
        bubbleAction: null,
        smoke: 0,
        stock: -1,
        cueTimer: 0,
        ringOn: false,
      };
    });
  }

  buildChef() {
    const c = this.layout.chef;
    this.chefEl = el('div', `abs chef chef-${c.mode}`);
    this.chefEl.style.width = `${c.w}px`;
    this.chefEl.style.height = `${c.h}px`;
    this.chefEl.style.zIndex = c.z;
    this.chefState = '';
    this.chefTimer = 0;
    this.root.append(this.chefEl);
    if (c.mode === 'paws') {
      const sp = SPECIES[this.profile.avatar] || SPECIES.fox;
      this.chefEl.innerHTML = pawsSvg(sp.fur);
      this.chefEl.style.top = `${c.y}px`;
      this.chefEl.style.left = `${c.homeX}px`;
    } else {
      this.setChef('idle', 'down');
      this.chefEl.style.left = `${c.homeX - c.w / 2}px`;
      this.chefEl.style.top = `${c.mode === 'row' ? c.y : c.homeY - c.h / 2}px`;
    }
  }

  buildHud() {
    const hud = (this.hud = el('div', 'hud'));
    hud.innerHTML = `
      <button class="btn round cream hud-pause">${icon('pause')}</button>
      <div class="hud-stat hud-stars"><span class="hud-ico">${icon('star')}</span><span class="num">0</span></div>
      <div class="hud-stat hud-coins"><span class="hud-ico">${icon('coin')}</span><span class="num">${this.profile.coins}</span></div>
      <div class="hud-mastery"></div>
      <div class="hud-ring"><div class="hud-ring-pie"></div><div class="hud-ring-ico">${icon('sun')}</div></div>`;
    this.root.append(hud);
    this.starsNum = hud.querySelector('.hud-stars .num');
    this.coinsNum = hud.querySelector('.hud-coins .num');
    this.masteryEl = hud.querySelector('.hud-mastery');
    this.ringPie = hud.querySelector('.hud-ring-pie');
    this.ringIco = hud.querySelector('.hud-ring-ico');
    hud.querySelector('.hud-pause').addEventListener('pointerdown', () => this.pause());
    this.hudRects = { stars: { x: 128, y: 42 }, coins: { x: 300, y: 42 }, ring: { x: 1220, y: 42 } };
  }

  // ------------------------------------------------------------------ input

  input() {
    this.sound.unlock();
    this.idleReal = 0;
    this.hand.classList.add('hidden');
  }

  tapCustomer(slot) {
    if (this.clock.paused) return;
    this.input();
    const r = this.kitchen.tapCustomer(slot);
    if (r !== 'none') this.moveChef(this.layout.customers[slot], 'customer');
  }

  tapStation(id) {
    if (this.clock.paused) return;
    this.input();
    const v = this.stationViews[id];
    const r = this.kitchen.tapStation(id);
    this.moveChef(v.rect, 'station');
    if (r === 'peek') {
      this.sound.play('peek');
      this.pulse(v.el, 'peek');
      this.setChef('idle', 'down', 0.8);
    } else if (r === 'start') {
      this.pulse(v.el, 'bounce');
    }
  }

  tapSink() {
    if (this.clock.paused) return;
    this.input();
    const r = this.kitchen.tapSink();
    if (r !== 'busy') this.moveChef(this.layout.sink, 'prop');
  }

  tapFridge() {
    if (this.clock.paused) return;
    this.input();
    const r = this.kitchen.tapFridge();
    if (r !== 'busy') this.moveChef(this.layout.fridge, 'prop');
  }

  tapJug() {
    if (this.clock.paused) return;
    this.input();
    this.kitchen.tapJuice();
    this.moveChef(this.layout.juice, 'prop');
  }

  tapSpill(id) {
    if (this.clock.paused) return;
    this.input();
    const v = this.spillViews.get(id);
    this.kitchen.tapSpill(id);
    if (v) this.moveChef({ x: v.x - 50, y: v.y - 30, w: 100, h: 60 }, 'customer');
  }

  tapPlate(slot) {
    if (this.clock.paused) return;
    this.input();
    const r = this.kitchen.tapPlate(slot);
    if (r === 'collected') this.moveChef(this.layout.dishes[slot], 'customer');
  }

  // ------------------------------------------------------------------- chef

  setChef(expr, arms, revertAfter = 0) {
    if (this.layout.chef.mode === 'paws') return;
    const key = `${expr}|${arms}`;
    if (key !== this.chefState) {
      this.chefState = key;
      this.chefEl.innerHTML = chefSvg(this.profile.avatar, this.profile.equipped.outfit, { expr, arms });
    }
    this.chefTimer = revertAfter;
  }

  moveChef(r, kind) {
    const c = this.layout.chef;
    const cx = r.x + (r.w ?? r.size) / 2;
    if (c.mode === 'row') {
      const x = Math.max(c.minX, Math.min(c.maxX, cx)) - c.w / 2;
      this.chefEl.style.left = `${x}px`;
    } else if (c.mode === 'paws') {
      const x = Math.max(c.minX, Math.min(c.maxX, cx - c.w / 2));
      this.chefEl.style.left = `${x}px`;
    } else {
      // Free roaming (split kitchen): stand beside whatever was tapped.
      let x;
      let y;
      const h = r.h ?? r.size;
      if (kind === 'station') {
        x = c.laneX - c.w / 2;
        y = r.y + h / 2 - c.h * 0.5;
      } else if (kind === 'customer') {
        // Stand between the two tables so nobody's face gets covered.
        x = c.diningX;
        y = c.diningY;
      } else {
        x = Math.max(640, Math.min(1150, r.x - c.w * 0.55));
        y = r.y + h - c.h + 30;
      }
      y = Math.max(90, Math.min(800 - c.h - 4, y));
      this.chefEl.style.left = `${x}px`;
      this.chefEl.style.top = `${y}px`;
    }
    this.pulse(this.chefEl, 'hop');
  }

  /** Play a one-shot CSS animation class, clearing any earlier one first. */
  pulse(node, cls) {
    node.classList.remove(...PULSES);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  /** Run something after `sec` of game time (pauses with the game). */
  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }

  // ----------------------------------------------------------------- events

  onEvent(type, d) {
    const L = this.layout;
    const s = this.sound;
    switch (type) {
      case 'customer-arrive': {
        const v = this.custViews[d.slot];
        v.look = d.customer.look;
        this.setExpr(d.slot, 'idle');
        v.el.classList.remove('out', 'leaving', 'calling');
        v.dish.classList.add('hidden');
        s.play('door', { vol: 0.7 });
        break;
      }
      case 'customer-ready': {
        const v = this.custViews[d.slot];
        this.setExpr(d.slot, 'wave');
        v.el.classList.add('calling');
        s.play('hello', { pitch: (d.customer.look % 7) - 3 });
        break;
      }
      case 'greeted': {
        const v = this.custViews[d.slot];
        v.el.classList.remove('calling');
        this.setExpr(d.slot, 'idle');
        v.bubble.querySelector('.bubble-food').innerHTML = foodIcon(d.recipeId);
        v.bubble.classList.remove('hidden', 'cooking');
        this.pulse(v.bubble, 'pop-in');
        s.play('pop');
        break;
      }
      case 'poke':
        this.pulse(this.custViews[d.slot].el, 'bounce');
        s.play('tap');
        break;
      case 'cook-start': {
        const v = this.stationViews[d.station];
        s.action(d.action);
        this.custViews[d.slot].bubble.classList.add('cooking');
        const p = center(v.rect);
        this.fx.burst(p.x, p.y - 20, { count: 6, kind: 'dot', colors: ['#fff', C.yellow], spread: 70, size: 14 });
        break;
      }
      case 'step': {
        const v = this.stationViews[d.station];
        const p = center(v.rect);
        s.action(d.action);
        this.pulse(v.el, d.action === 'flip' ? 'act-flip' : 'act');
        this.fx.float(actionIcon(d.action), p.x, v.rect.y + 10, { size: 78 });
        if (d.outcome === 'perfect') {
          this.fx.burst(p.x, p.y - 30, { count: 10, spread: 110 });
          s.play('star', { vol: 0.8 });
          this.setChef('happy', 'up', 1.2);
        } else if (d.outcome === 'late') {
          this.fx.burst(p.x, p.y - 30, { count: 5, kind: 'dot', colors: [C.orange, '#fff'], spread: 70, size: 14 });
          this.setChef('ok', 'down', 1.2);
        }
        break;
      }
      case 'served':
        this.onServed(d);
        break;
      case 'burnt': {
        const v = this.stationViews[d.station];
        const p = center(v.rect);
        s.play('burnt');
        this.fx.puff(p.x, p.y - 40, { color: '#5c5c66', count: 9 });
        this.setChef('ok', 'down', 1.6);
        break;
      }
      case 'abandoned': {
        if (d.station) {
          const v = this.stationViews[d.station];
          const p = center(v.rect);
          this.fx.puff(p.x, p.y - 30, { color: '#77777f', count: 10, size: 56 });
          s.play('poof');
        }
        if (d.slot != null) this.custViews[d.slot].bubble.classList.add('hidden');
        this.recordProgress(0, d.order);
        break;
      }
      case 'customer-leave': {
        const v = this.custViews[d.slot];
        this.setExpr(d.slot, d.mood);
        v.bubble.classList.add('hidden');
        v.jb.classList.add('hidden');
        v.el.classList.remove('calling');
        v.el.classList.add('leaving');
        if (d.mood === 'sad') s.play('sad', { vol: 0.8 });
        this.after(0.35, () => v.el.classList.add('out'));
        break;
      }
      case 'customer-gone':
        this.custViews[d.slot].el.classList.add('out');
        break;
      case 'plate-dirty': {
        const v = this.custViews[d.slot];
        v.dish.classList.add('hidden');
        this.fx.fly(this.dirtyPlateHtml(), center(L.dishes[d.slot]), this.sinkPoint(), { size: 80, endSize: 56, dur: 700, spin: 180 });
        s.play('plate', { vol: 0.6 });
        break;
      }
      case 'plate-left': {
        const v = this.custViews[d.slot];
        v.dish.innerHTML = this.dirtyPlateHtml();
        v.dish.classList.remove('hidden', 'burnt');
        v.dish.classList.add('dirty');
        break;
      }
      case 'plate-collected': {
        const v = this.custViews[d.slot];
        v.dish.classList.add('hidden');
        v.dish.classList.remove('dirty');
        this.fx.fly(this.dirtyPlateHtml(), center(L.dishes[d.slot]), this.sinkPoint(), { size: 80, endSize: 56, dur: 650, spin: 180 });
        s.play('plate', { vol: 0.7 });
        break;
      }
      case 'juice-request': {
        const v = this.custViews[d.slot];
        v.jb.classList.remove('hidden');
        this.pulse(v.jb, 'pop-in');
        this.setExpr(d.slot, 'thirsty');
        this.jugEl.classList.remove('hidden');
        this.pulse(this.jugEl, 'bounce');
        s.play('thirsty');
        break;
      }
      case 'juice-served': {
        const v = this.custViews[d.slot];
        v.jb.classList.add('hidden');
        this.fx.fly(foodIcon('juice'), center(L.juice), center(L.customers[d.slot]), { size: 64, dur: 550 });
        s.play('juice');
        this.setExpr(d.slot, 'happy');
        this.after(1.2, () => this.refreshExpr(d.slot));
        break;
      }
      case 'juice-timeout':
        this.custViews[d.slot].jb.classList.add('hidden');
        this.setExpr(d.slot, 'ok');
        break;
      case 'wash-start':
        s.play('wash');
        this.pulse(this.sinkEl, 'bounce');
        break;
      case 'washed': {
        s.play('washed');
        const p = this.sinkPoint();
        this.fx.burst(p.x + 40, p.y - 60, { count: 6, colors: ['#fff', '#bfe6ff'], spread: 60 });
        break;
      }
      case 'restock-start':
        s.play('fridge');
        this.pulse(this.fridgeEl, 'bounce');
        break;
      case 'restocked': {
        const v = this.stationViews[d.station];
        this.fx.fly(ingredientIcon(d.station), center(L.fridge), center(v.rect), { size: 64, dur: 600, spin: 360, onDone: () => this.pulse(v.stockEl, 'bounce') });
        s.play('restocked');
        break;
      }
      case 'spill':
        this.addSpill(d.spill);
        s.play('spill', { vol: 0.7 });
        break;
      case 'scrub': {
        const v = this.spillViews.get(d.id);
        if (v) {
          v.el.dataset.hp = d.hp;
          this.swipe(v);
        }
        s.play('scrub');
        break;
      }
      case 'wiped': {
        const v = this.spillViews.get(d.id);
        if (v) {
          this.swipe(v);
          this.fx.burst(v.x, v.y, { count: 7, colors: ['#fff', '#bfe6ff', C.yellow], spread: 70 });
          v.el.remove();
          this.spillViews.delete(d.id);
        }
        s.play('wiped');
        break;
      }
      case 'coins':
        this.profile.coins += d.amount;
        this.payCoins(d.amount, this.sourcePoint(d.source));
        break;
      case 'nope': {
        const target = d.target === 'station' ? this.stationViews[d.station].el
          : d.target === 'sink' ? this.sinkEl : d.target === 'fridge' ? this.fridgeEl : this.jugEl;
        this.pulse(target, 'shake');
        s.play('nope', { vol: 0.7 });
        this.setChef('ok', 'down', 0.8);
        break;
      }
      case 'need': {
        const target = d.what === 'plate' ? this.sinkEl : this.fridgeEl;
        this.pulse(target, 'bounce');
        this.pulse(this.stationViews[d.station].el, 'shake');
        s.play('need');
        this.showHand(d.what === 'plate' ? L.sink : L.fridge);
        break;
      }
      case 'nudge':
        this.setChef('idle', 'wave', 1.6);
        this.pulse(this.chefEl, 'look');
        if (this.petEl) this.pulse(this.petEl, 'bounce');
        s.play('nudge', { vol: 0.6 });
        break;
      case 'customer-missed':
      case 'spaceout':
      case 'quick':
      case 'ready':
      case 'late':
      case 'peek':
      default:
        break;
    }
  }

  onServed(d) {
    const L = this.layout;
    const s = this.sound;
    const v = this.stationViews[d.station];
    const slot = d.slot;
    const from = center(v.rect);
    s.action('plate');
    this.profile.coins += d.coins;
    if (slot == null) {
      this.recordProgress(d.stars, d.order);
      return;
    }
    const cv = this.custViews[slot];
    cv.bubble.classList.add('hidden');
    const dishRect = L.dishes[slot];
    const to = center(dishRect);
    const food = `<div class="${d.burnt ? 'burnt' : ''}" style="width:100%;height:100%">${foodIcon(d.order.recipeId)}</div>`;
    this.fx.fly(food, { x: from.x, y: from.y - 30 }, to, {
      size: 96, endSize: dishRect.size, dur: 520, arc: 120,
      onDone: () => {
        cv.dish.innerHTML = foodIcon(d.order.recipeId);
        cv.dish.classList.remove('hidden', 'dirty');
        cv.dish.classList.toggle('burnt', d.burnt);
        this.pulse(cv.dish, 'pop-in');
      },
    });
    this.after(0.5, () => {
      s.play(`served${d.stars}`);
      this.setExpr(slot, d.stars === 3 ? 'happy' : d.stars === 2 ? 'ok' : 'grumpy');
      this.pulse(cv.el, d.stars === 3 ? 'joy' : d.stars === 1 ? 'shake' : 'bounce');
      const head = { x: cv.rect.x + cv.rect.w / 2, y: cv.rect.y + cv.rect.h * 0.3 };
      for (let i = 0; i < d.stars; i++) {
        this.fx.fly(icon('star'), { x: head.x + (i - (d.stars - 1) / 2) * 46, y: head.y - 40 }, this.hudRects.stars, {
          size: 54, endSize: 40, dur: 800, delay: 250 + i * 140, arc: 60,
          onDone: () => {
            this.shownStars++;
            this.starsNum.textContent = this.shownStars;
            this.pulse(this.starsNum.parentNode, 'bounce');
            s.play('star', { vol: 0.5 });
          },
        });
      }
      if (d.stars === 3) this.fx.burst(head.x, head.y, { count: 12, spread: 120 });
      if (d.busyBee) this.fx.burst(to.x, to.y, { count: 8, colors: [C.yellow, C.orange], spread: 90 });
      this.payCoins(d.coins, to, 0.3);
      if (d.stars === 3) this.setChef('happy', 'up', 1.6);
      else if (d.stars === 1) this.setChef('ok', 'down', 1.6);
    });
    this.after(0.9, () => s.play(d.stars === 3 ? 'happy' : d.stars === 2 ? 'ok' : 'grumpy', { vol: 0.8 }));
    this.after(2.0, () => {
      const c = this.kitchen.customers[slot];
      if (c && c.state === 'eating') {
        this.setExpr(slot, 'eating');
        s.play('munch', { vol: 0.6 });
      }
    });
    if (this.tutorial) {
      this.tutorialServed++;
      if (this.tutorialServed >= 2) {
        this.tutorial = false;
        this.profile.tutorialDone = true;
      }
    }
    this.recordProgress(d.stars, d.order);
  }

  dirtyPlateHtml() {
    return `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="45" ry="16" fill="#fff" stroke="#4a2b17" stroke-width="4"/><ellipse cx="50" cy="59" rx="31" ry="9" fill="#d9b98a"/><circle cx="40" cy="58" r="5" fill="#9a5b2a"/><circle cx="60" cy="60" r="4" fill="#ef5b4c"/><circle cx="50" cy="54" r="3" fill="#6cc35b"/></svg>`;
  }

  sinkPoint() {
    const r = this.layout.sink;
    return { x: r.x + r.w * 0.25, y: r.y + r.h * 0.42 };
  }

  sourcePoint(source) {
    const L = this.layout;
    if (!source) return center(L.customers[0]);
    switch (source.type) {
      case 'sink': return this.sinkPoint();
      case 'fridge': return center(L.fridge);
      case 'spill': {
        const v = this.spillViews.get(source.id);
        return v ? { x: v.x, y: v.y } : center(L.spills[0] ? { ...L.spills[0], w: 0, h: 0 } : L.sink);
      }
      case 'juice': return center(L.customers[source.slot]);
      case 'plate': return center(L.dishes[source.slot]);
      default: return center(L.sink);
    }
  }

  payCoins(amount, from, delay = 0) {
    if (!amount) return;
    const shown = Math.min(amount, 6);
    for (let i = 0; i < shown; i++) {
      const share = Math.floor(amount / shown) + (i < amount % shown ? 1 : 0);
      this.fx.fly(icon('coin'), { x: from.x + (Math.random() - 0.5) * 40, y: from.y - 10 }, this.hudRects.coins, {
        size: 44, endSize: 36, dur: 700, delay: delay * 1000 + i * 90, arc: 80, spin: 360,
        onDone: () => {
          this.shownCoins += share;
          this.coinsNum.textContent = this.shownCoins;
          this.pulse(this.coinsNum.parentNode, 'bounce');
          if (i === 0) this.sound.play('coin', { vol: 0.6 });
        },
      });
    }
  }

  addSpill(spill) {
    const spot = this.layout.spills[spill.spot] || this.layout.spills[0];
    const node = el('div', 'abs spill pop-in', `<div class="spill-art">${spillSvg(spill.kind)}</div>`);
    node.style.left = `${spot.x - 70}px`;
    node.style.top = `${spot.y - 42}px`;
    node.style.zIndex = this.layout.z.counterItems + 1;
    node.dataset.hp = spill.hp;
    node.addEventListener('pointerdown', () => this.tapSpill(spill.id));
    this.root.append(node);
    this.spillViews.set(spill.id, { el: node, x: spot.x, y: spot.y });
  }

  swipe(v) {
    const node = el('div', 'abs cloth', clothSvg());
    node.style.left = `${v.x - 36}px`;
    node.style.top = `${v.y - 34}px`;
    node.style.zIndex = 40;
    this.root.append(node);
    const anim = node.animate([
      { transform: 'translateX(-46px) rotate(-12deg)', opacity: 0 },
      { transform: 'translateX(-30px) rotate(-8deg)', opacity: 1, offset: 0.15 },
      { transform: 'translateX(36px) rotate(10deg)', opacity: 1, offset: 0.6 },
      { transform: 'translateX(-10px) rotate(-4deg)', opacity: 0 },
    ], { duration: 380, easing: 'ease-in-out' });
    anim.onfinish = () => node.remove();
  }

  // ------------------------------------------------------------ expressions

  setExpr(slot, expr) {
    const v = this.custViews[slot];
    if (v.look == null) return;
    const key = `${v.look}|${expr}`;
    if (v.expr === key) return;
    v.expr = key;
    v.art.innerHTML = customerSvg(v.look, expr);
  }

  refreshExpr(slot) {
    const c = this.kitchen.customers[slot];
    if (!c) return;
    const expr = c.juice ? 'thirsty' : c.state === 'waiting' ? 'wave' : c.state === 'eating' ? 'eating' : 'idle';
    this.setExpr(slot, expr);
  }

  // ------------------------------------------------------------ progression

  recordProgress(stars, order) {
    const p = this.profile;
    const locked = p.settings.override.enabled;
    const r = recordOrder({ level: p.level, recent: p.recent }, stars, { locked });
    p.level = r.level;
    p.recent = r.recent;
    // If attention drifted on a failed dish, bring the gentle nudge back.
    if (order && order.spacedOut && stars < 2 && p.settings.nudge !== 'off') this.kitchen.options.nudge = true;
    if (r.change) {
      this.dials = dialsFor(p.level, p.settings.override);
      this.kitchen.setDials(this.dials);
      this.root.dataset.cue = this.dials.cue;
      this.kitchen.options.nudge = this.kitchen.options.nudge || this.nudgeAllowed();
      for (const st of this.kitchen.stationList()) {
        this.sound.cooking(st.id, COOKING.has(st.phase) ? CUE_LOOP[this.dials.cue] : 0);
      }
      if (r.change === 'up') {
        this.levelUps++;
        this.after(1.4, () => this.celebrateLevel());
      }
    }
    this.renderMastery(r.change);
    this.app.store.save();
  }

  renderMastery(change) {
    const m = masteryProgress({ level: this.profile.level, recent: this.profile.recent });
    let html = '';
    for (let i = 0; i < m.window; i++) {
      const r = m.results[i];
      html += `<i class="${r === true ? 'ok' : r === false ? 'no' : ''}${i === m.results.length - 1 ? ' last' : ''}"></i>`;
    }
    this.masteryEl.innerHTML = html;
    this.masteryEl.classList.toggle('locked', this.profile.settings.override.enabled);
    if (change) this.pulse(this.masteryEl, 'bounce');
  }

  celebrateLevel() {
    this.sound.play('levelup');
    this.fx.confetti(60);
    const banner = el('div', 'levelup', `<div class="levelup-hat">${icon('hat')}</div><div class="levelup-stars">${icon('star')}${icon('star')}${icon('star')}</div>`);
    this.root.append(banner);
    this.setChef('happy', 'up', 2.5);
    setTimeout(() => banner.remove(), 2800);
  }

  // ------------------------------------------------------------------- loop

  tick(dt) {
    if (this.finished) return;
    this.kitchen.update(dt);
    this.sessionTime += dt;
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const t = this.timers[i];
      t.t -= dt;
      if (t.t <= 0) {
        this.timers.splice(i, 1);
        t.fn();
      }
    }
    if (!this.kitchen.closing && this.sessionTime >= this.sessionLength) {
      this.kitchen.close();
      this.sound.play('closing');
      this.ringIco.innerHTML = icon('moon');
      this.pulse(this.ringIco.parentNode, 'bounce');
    }
    if (this.kitchen.closing) {
      this.closingFor += dt;
      if (this.kitchen.isDone() || this.closingFor > 100) {
        this.after(1.2, () => this.finish());
        this.closingFor = -1e9;
      }
    }
    if (this.chefTimer > 0) {
      this.chefTimer -= dt;
      if (this.chefTimer <= 0) this.setChef('idle', 'down');
    }
    if (this.app.debug.bot) this.runBot(dt);
    this.idleReal += dt;
    this.render(dt);
  }

  render(dt) {
    const k = this.kitchen;
    for (const st of k.stationList()) this.renderStation(this.stationViews[st.id], st, dt);

    // Sink and fridge.
    const washing = k.sink.washing > 0;
    const sinkKey = `${k.plates.dirty}|${k.plates.clean}|${washing}`;
    if (sinkKey !== this.sinkKey) {
      this.sinkKey = sinkKey;
      this.sinkEl.querySelector('.prop-art').innerHTML = sinkSvg({ dirty: k.plates.dirty, clean: k.plates.clean, washing });
      this.sinkEl.querySelector('.need').classList.toggle('hidden', k.plates.clean > 0);
      this.sinkEl.classList.toggle('has-work', k.plates.dirty > 0);
    }
    const open = k.fridge.busy > 0;
    const empty = k.stationList().find((s) => s.stock <= 0);
    const fridgeKey = `${open}|${empty ? empty.id : ''}`;
    if (fridgeKey !== this.fridgeKey) {
      this.fridgeKey = fridgeKey;
      this.fridgeEl.querySelector('.prop-art').innerHTML = fridgeSvg(open);
      const need = this.fridgeEl.querySelector('.need');
      need.classList.toggle('hidden', !empty);
      if (empty) need.innerHTML = ingredientIcon(empty.id);
    }

    // Session ring, sky and wall clock.
    const p = Math.min(1, this.sessionTime / this.sessionLength);
    this.ringPie.style.setProperty('--p', p.toFixed(4));
    this.skyTimer -= dt;
    if (this.skyTimer <= 0 && this.windowEl) {
      this.skyTimer = 1;
      const sky = skyAt(p);
      const w = this.windowEl;
      w.querySelector('.sky').setAttribute('fill', sky.color);
      const sun = w.querySelector('.sun');
      sun.setAttribute('cx', sky.sunX.toFixed(1));
      sun.setAttribute('cy', sky.sunY.toFixed(1));
      sun.setAttribute('fill', sky.night ? '#fff6c9' : '#ffd84a');
      w.querySelector('.stars').setAttribute('opacity', sky.night ? 1 : 0);
    }
    if (this.clockHand) this.clockHand.setAttribute('transform', `rotate(${((k.t % 60) * 6).toFixed(1)} 50 50)`);

    this.renderHand();
  }

  renderStation(v, st, dt) {
    const k = this.kitchen;
    const cue = this.dials.cue;
    const key = visualKey(st);
    if (key !== v.key) {
      v.key = key;
      v.art.innerHTML = stationSvg(st.id, visualState(st));
    }
    if (v.phase !== st.phase) {
      const cooking = COOKING.has(st.phase);
      this.sound.cooking(st.id, cooking ? CUE_LOOP[cue] : 0);
      v.cueTimer = 0;
      if (st.phase === 'ready' && cue === 2) {
        this.sound.cue(st.id, 0.22);
        v.cueTimer = Infinity;
      }
      if ((st.phase === 'ready' || st.phase === 'late') && cue >= 2) v.cueTimer = Infinity;
      v.phase = st.phase;
      v.el.dataset.phase = st.phase;
    }
    const ringOn = st.phase === 'wait' && (cue === 0 || k.isPeeking(st));
    if (ringOn !== v.ringOn) {
      v.ringOn = ringOn;
      v.ring.classList.toggle('show', ringOn);
    }
    if (ringOn) v.pie.style.setProperty('--p', k.progress(st).toFixed(3));

    let action = null;
    if (st.phase === 'quick' || st.phase === 'burnt') action = k.nextAction(st);
    else if ((st.phase === 'ready' || st.phase === 'late') && cue <= 1) action = k.nextAction(st);
    if (action !== v.bubbleAction) {
      v.bubbleAction = action;
      if (action) v.bubble.innerHTML = actionIcon(action);
      v.bubble.classList.toggle('show', !!action);
    }

    let smoke = 0;
    if (st.phase === 'burnt') smoke = 3;
    else if (st.phase === 'late') smoke = cue <= 1 ? 2 : cue === 2 ? 1 : k.danger(st) > 0.5 ? 1 : 0;
    if (smoke !== v.smoke) {
      v.smoke = smoke;
      v.el.dataset.smoke = smoke;
    }

    if (st.stock !== v.stock) {
      v.stock = st.stock;
      v.pips.forEach((pip, i) => pip.classList.toggle('on', i < st.stock));
      v.stockEl.classList.toggle('empty', st.stock <= 0);
    }

    if (st.phase === 'ready' || st.phase === 'late') {
      v.cueTimer -= dt;
      if (v.cueTimer <= 0) {
        if (st.phase === 'ready') {
          this.sound.cue(st.id, cue === 0 ? 1 : 0.6);
          v.cueTimer = cue === 0 ? 2.4 : 4.5;
        } else {
          this.sound.alarm(cue === 0 ? 1 : 0.6);
          v.cueTimer = cue === 0 ? 1.1 : 1.8;
        }
      }
    }
  }

  // --------------------------------------------------------- tutorial hand

  renderHand() {
    if (this.app.debug.bot) return;
    const k = this.kitchen;
    let s = null;
    if (this.tutorial) {
      if (this.idleReal > 0.9) s = k.suggest({ includeTimed: true });
    } else if (this.idleReal > 9) {
      const g = k.suggest();
      if (g && g.blocking) s = g;
    }
    if (!s) {
      if (!this.handHold) this.hand.classList.add('hidden');
      return;
    }
    this.showHand(this.rectOf(s), true, s.type === 'station');
  }

  rectOf(s) {
    const L = this.layout;
    switch (s.type) {
      case 'station': return this.stationViews[s.id].rect;
      case 'customer': return L.customers[s.slot];
      case 'sink': return L.sink;
      case 'fridge': return L.fridge;
      case 'plate': return L.dishes[s.slot];
      case 'spill': {
        const v = this.spillViews.get(s.id);
        return v ? { x: v.x - 50, y: v.y - 30, w: 100, h: 60 } : L.sink;
      }
      default: return L.sink;
    }
  }

  showHand(r, live = false, beside = false) {
    const w = r.w ?? r.size;
    // Beside a station the hand sits to one side so it never hides the action bubble.
    const x = beside ? r.x + w * 0.8 - 38 : r.x + w / 2 - 38;
    const y = beside ? r.y - 6 : Math.max(70, r.y - 60);
    this.hand.style.left = `${x}px`;
    this.hand.style.top = `${y}px`;
    this.hand.classList.remove('hidden');
    if (!live) {
      this.handHold = true;
      setTimeout(() => { this.handHold = false; }, 2200);
    }
  }

  // ------------------------------------------------------------------ pause

  pause() {
    if (this.finished || this.clock.pauses.has('user')) return;
    this.sound.unlock();
    this.sound.play('tap');
    this.clock.pause('user');
    this.root.classList.add('paused');
    setTimeout(() => this.sound.hold(true), 120);
    const o = this.overlay;
    const g = this.app.store.globals;
    o.className = 'overlay pause-menu';
    o.innerHTML = `
      <div class="pause-card pop-in">
        <button class="btn round green pause-play">${icon('play')}</button>
        <div class="pause-row">
          <button class="btn round red pause-home">${icon('home')}</button>
          <button class="btn round cream pause-sound">${icon(g.sound ? 'soundOn' : 'soundOff')}</button>
          <button class="btn round cream pause-music ${g.music ? '' : 'off'}">${icon('music')}</button>
          <button class="btn round cream pause-full">${icon('full')}</button>
        </div>
      </div>`;
    o.querySelector('.pause-play').onclick = () => this.resume();
    o.querySelector('.pause-home').onclick = () => {
      this.sound.hold(false);
      this.finish();
    };
    o.querySelector('.pause-sound').onclick = (e) => {
      g.sound = !g.sound;
      this.sound.setEnabled(g.sound);
      e.currentTarget.innerHTML = icon(g.sound ? 'soundOn' : 'soundOff');
      this.app.store.save();
    };
    o.querySelector('.pause-music').onclick = (e) => {
      g.music = !g.music;
      this.sound.setMusic(g.music);
      e.currentTarget.classList.toggle('off', !g.music);
      this.app.store.save();
    };
    o.querySelector('.pause-full').onclick = () => this.app.toggleFullscreen();
  }

  resume() {
    this.overlay.className = 'overlay hidden';
    this.overlay.innerHTML = '';
    this.root.classList.remove('paused');
    this.sound.hold(false);
    this.clock.resume('user');
  }

  // ----------------------------------------------------------------- finish

  finish({ silent = false } = {}) {
    if (this.finished) return;
    this.finished = true;
    this.clock.stop();
    this.sound.stopAllLoops();
    const p = this.profile;
    const session = this.kitchen.session;
    let summary = null;
    if (this.sessionTime >= 5 || session.orders.length) {
      summary = summarizeSession(session, { durationSec: this.sessionTime, levelStart: this.levelStart, levelEnd: p.level });
      applySession(p, summary);
    }
    this.app.store.save();
    if (silent) return;
    this.app.go('summary', { profile: p, summary, orders: session.orders, levelUps: this.levelUps });
  }

  // -------------------------------------------------------------------- bot

  /** Debug auto-player (?bot=1): plays through the same tap handlers. */
  runBot(dt) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.4;
    const mode = this.app.debug.bot;
    if (mode === 'idle') return;
    const s = this.kitchen.suggest({ includeTimed: mode !== 'lazy' });
    if (!s) return;
    if (mode === 'lazy' && s.type === 'station' && this.kitchen.stations[s.id].phase === 'burnt' && Math.random() < 0.9) return;
    switch (s.type) {
      case 'station': this.tapStation(s.id); break;
      case 'customer': this.tapCustomer(s.slot); break;
      case 'sink': this.tapSink(); break;
      case 'fridge': this.tapFridge(); break;
      case 'spill': this.tapSpill(s.id); break;
      case 'plate': this.tapPlate(s.slot); break;
      default: break;
    }
  }
}
