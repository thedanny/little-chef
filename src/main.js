// Little Chef – app shell: stage scaling, screen routing, storage and sound.

import { Store } from './engine/storage.js';
import { clampLevel } from './engine/difficulty.js';
import { sound } from './ui/audio.js';
import { el } from './ui/art/common.js';
import { KitchenScreen } from './ui/kitchenView.js';
import { HomeScreen, CreateScreen } from './ui/screens/home.js';
import { HubScreen } from './ui/screens/hub.js';
import { SummaryScreen } from './ui/screens/summary.js';
import { ShopScreen } from './ui/screens/shop.js';
import { ParentScreen } from './ui/screens/parent.js';

const STAGE_W = 1280;
const STAGE_H = 800;

const SCREENS = {
  home: HomeScreen,
  create: CreateScreen,
  hub: HubScreen,
  kitchen: KitchenScreen,
  summary: SummaryScreen,
  shop: ShopScreen,
  parent: ParentScreen,
};

function safeStorage() {
  try {
    const k = '__lc_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    return null; // private mode etc.: fall back to in-memory storage
  }
}

function parseDebug() {
  const q = new URLSearchParams(location.search);
  const num = (k) => (q.has(k) ? Number(q.get(k)) : undefined);
  const d = {
    speed: num('speed'),
    sessionSec: num('session'),
    seed: num('seed'),
    bot: q.get('bot') === '1' ? 'good' : q.get('bot') || null,
    level: num('level'),
    layout: num('layout'),
    quick: q.has('quick'),
    cue: num('cue'),
  };
  d.expose = q.has('debug') || Object.values(d).some((v) => v !== undefined && v !== null && v !== false);
  return d;
}

class App {
  constructor() {
    this.root = document.getElementById('app');
    this.stage = el('div', 'stage');
    this.root.append(this.stage);
    this.store = new Store(safeStorage());
    this.sound = sound;
    this.debug = parseDebug();
    sound.setEnabled(this.store.globals.sound);
    sound.setMusic(this.store.globals.music);
    this.current = null;

    this.fit = this.fit.bind(this);
    window.addEventListener('resize', this.fit);
    window.addEventListener('orientationchange', this.fit);
    this.fit();

    // Browsers only allow audio after a touch.
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    // No accidental zoom / context menu / drag on a kid's tablet.
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    if (this.debug.expose) globalThis.__app = this;
    // Offline play once installed (only on a real https site, never in dev).
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || new URLSearchParams(location.search).has('sw'))) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    this.start();
  }

  start() {
    const d = this.debug;
    if (d.quick) {
      let p = this.store.profiles[0];
      if (!p) p = this.store.addProfile({ name: 'Tester', avatar: 'fox' });
      if (d.level !== undefined) {
        p.level = clampLevel(d.level);
        p.recent = [];
      }
      if (d.layout) p.settings.layout = d.layout;
      if (d.cue !== undefined) p.settings.override = { enabled: true, cue: d.cue, wait: 0, conc: 0 };
      p.tutorialDone = !new URLSearchParams(location.search).has('tutorial');
      this.go('kitchen', { profile: p });
      return;
    }
    this.go('home');
  }

  fit() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const s = Math.min(w / STAGE_W, h / STAGE_H);
    this.scale = s;
    this.stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    // Square corners when the stage fills the screen edge to edge.
    this.stage.style.borderRadius = Math.abs(w / h - STAGE_W / STAGE_H) < 0.02 ? '0' : '';
  }

  go(name, params = {}) {
    if (this.current && this.current.destroy) this.current.destroy();
    this.stage.innerHTML = '';
    const Screen = SCREENS[name] || HomeScreen;
    this.screenName = name;
    this.current = new Screen(this, params);
    const node = this.current.mount();
    node.classList.add('enter');
    this.stage.append(node);
  }

  toggleFullscreen() {
    const doc = document;
    if (doc.fullscreenElement) {
      doc.exitFullscreen?.();
    } else {
      doc.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
    }
  }
}

new App();
