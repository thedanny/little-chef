// Local-only persistence: per-child profiles, settings and play history.
// No accounts, nothing leaves the device.

import { defaultOwned } from './catalog.js';
import { clampDials, clampLevel } from './difficulty.js';

export const STORAGE_KEY = 'little-chef/v1';
export const SCHEMA = 1;
export const MAX_SESSIONS_KEPT = 90;
export const AVATARS = ['fox', 'bear', 'bunny', 'cat', 'frog', 'panda', 'pig', 'owl'];

export function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function defaultGlobals() {
  return {
    goalMin: 7, // daily session goal (5–10 minutes)
    capMin: 20, // daily play cap; 0 = no cap
    cooldownMin: 0, // rest between sessions; 0 = off
    sound: true,
    music: true,
  };
}

export function createProfile({ name = '', avatar = 'fox' } = {}) {
  return {
    id: `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    name: String(name).slice(0, 16),
    avatar: AVATARS.includes(avatar) ? avatar : 'fox',
    created: Date.now(),
    coins: 0,
    level: 0,
    recent: [],
    tutorialDone: false,
    owned: defaultOwned(),
    equipped: { outfit: 'classic', pet: null, wall: 'sunny', decor: [] },
    settings: {
      override: { enabled: false, cue: 0, wait: 0, conc: 0 },
      layout: 'auto', // 'auto' | 1 | 2 | 3
      nudge: 'auto', // 'auto' | 'on' | 'off'
    },
    stats: {
      sessions: [],
      totals: { sessions: 0, orders: 0, success: 0, perfect: 0, stars: 0, playSec: 0, spaceOuts: 0, bestLevel: 0 },
    },
    days: {}, // dayKey → { playedSec, sessions }
    lastSessionEnd: 0,
    pending: null, // summary of a session that was interrupted (app closed in the background)
  };
}

function sanitizeProfile(raw) {
  const base = createProfile({ name: raw?.name, avatar: raw?.avatar });
  if (!raw || typeof raw !== 'object') return base;
  const p = { ...base, ...raw };
  p.id = typeof raw.id === 'string' ? raw.id : base.id;
  p.name = base.name;
  p.avatar = base.avatar;
  p.tutorialDone = !!raw.tutorialDone;
  p.lastSessionEnd = Number.isFinite(+raw.lastSessionEnd) ? +raw.lastSessionEnd : 0;
  p.created = Number.isFinite(+raw.created) ? +raw.created : base.created;
  p.coins = Math.max(0, Math.floor(+raw.coins || 0));
  p.level = clampLevel(+raw.level || 0);
  p.recent = Array.isArray(raw.recent) ? raw.recent.map(Boolean).slice(-12) : [];
  p.owned = Array.from(new Set([...(Array.isArray(raw.owned) ? raw.owned : []), ...defaultOwned()]));
  p.equipped = { ...base.equipped, ...(raw.equipped || {}) };
  if (!Array.isArray(p.equipped.decor)) p.equipped.decor = [];
  p.settings = { ...base.settings, ...(raw.settings || {}) };
  p.settings.override = { enabled: !!raw.settings?.override?.enabled, ...clampDials(raw.settings?.override || {}) };
  p.stats = {
    sessions: Array.isArray(raw.stats?.sessions)
      ? raw.stats.sessions.filter((s) => s && typeof s === 'object' && Number.isFinite(+s.orders)).slice(-MAX_SESSIONS_KEPT)
      : [],
    totals: { ...base.stats.totals, ...(raw.stats?.totals || {}) },
  };
  p.days = {};
  if (raw.days && typeof raw.days === 'object') {
    for (const [key, d] of Object.entries(raw.days)) {
      if (d && typeof d === 'object') p.days[key] = { playedSec: Math.max(0, +d.playedSec || 0), sessions: Math.max(0, Math.floor(+d.sessions || 0)) };
    }
  }
  p.pending = raw.pending && typeof raw.pending === 'object' && Number.isFinite(+raw.pending.durationSec) ? raw.pending : null;
  return p;
}

function memoryBackend() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

export class Store {
  constructor(backend) {
    this.backend = backend || memoryBackend();
    this.data = { schema: SCHEMA, globals: defaultGlobals(), profiles: [], lastProfile: null };
    this.load();
  }

  load() {
    try {
      const raw = this.backend.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      this.data = {
        schema: SCHEMA,
        globals: { ...defaultGlobals(), ...(parsed.globals || {}) },
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles.map(sanitizeProfile) : [],
        lastProfile: parsed.lastProfile || null,
      };
    } catch {
      // Corrupt or unavailable storage: start fresh rather than crash.
    }
  }

  save() {
    try {
      this.backend.setItem(STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }

  get globals() { return this.data.globals; }
  get profiles() { return this.data.profiles; }

  profile(id) {
    return this.data.profiles.find((p) => p.id === id) || null;
  }

  addProfile(fields) {
    const p = createProfile(fields);
    this.data.profiles.push(p);
    this.save();
    return p;
  }

  removeProfile(id) {
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    if (this.data.lastProfile === id) this.data.lastProfile = null;
    this.save();
  }

  resetProfile(id) {
    const i = this.data.profiles.findIndex((p) => p.id === id);
    if (i < 0) return null;
    const old = this.data.profiles[i];
    const fresh = createProfile({ name: old.name, avatar: old.avatar });
    fresh.id = old.id;
    this.data.profiles[i] = fresh;
    this.save();
    return fresh;
  }

  exportJson() {
    return JSON.stringify(this.data, null, 2);
  }
}
