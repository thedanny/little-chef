// Parent Mode: a simple dashboard per child, the difficulty dials and the
// play-time settings. This is the one place in the game with words.

import { el } from '../art/common.js';
import { avatarSvg } from '../art/animals.js';
import { icon } from '../art/props.js';
import { aggregate, dayStatus } from '../../engine/stats.js';
import { LADDER, MAX_LEVEL, dialsFor, clampDials, masteryProgress } from '../../engine/difficulty.js';
import { WAIT_LEVELS, WINDOWS } from '../../engine/recipes.js';
import { escapeHtml } from './home.js';

const CUE_NAMES = ['Loud', 'Clear', 'Subtle', 'Silent'];
const CUE_HELP = [
  'Timer ring always visible, the station bounces and its sound repeats when the dish is ready.',
  'No timer ring. The station still glows and plays its sound when ready.',
  'Only a faint sparkle and one quiet sound when ready.',
  'No cue at all – your child has to keep track of the time (they can tap a station to peek).',
];
const CONC_NAMES = ['One dish', 'Two dishes', 'Two dishes + interruptions'];
const waitLabel = (i) => `${WAIT_LEVELS[i][0]}–${WAIT_LEVELS[i][1]} s`;

const pct = (v) => (v == null ? '–' : `${Math.round(v * 100)}%`);
const num = (v, d = 1) => (v == null ? '–' : v.toFixed(d));

function chart(values, { max, color = '#4d9de0', kind = 'line', fmt = (v) => v, height = 120 }) {
  const w = 420;
  const h = height;
  const pad = { l: 34, r: 10, t: 10, b: 18 };
  const data = values.filter((v) => v != null);
  if (!data.length) return `<div class="pm-empty">No sessions yet</div>`;
  const top = max ?? Math.max(1, ...data) * 1.15;
  const n = values.length;
  const x = (i) => pad.l + (n === 1 ? (w - pad.l - pad.r) / 2 : (i / (n - 1)) * (w - pad.l - pad.r));
  const y = (v) => pad.t + (1 - Math.min(1, v / top)) * (h - pad.t - pad.b);
  let marks = '';
  if (kind === 'bar') {
    const bw = Math.min(26, (w - pad.l - pad.r) / n - 4);
    values.forEach((v, i) => {
      if (v == null) return;
      const bx = n === 1 ? x(0) - bw / 2 : pad.l + (i + 0.5) * ((w - pad.l - pad.r) / n) - bw / 2;
      marks += `<rect x="${bx.toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(h - pad.b - y(v)).toFixed(1)}" rx="3" fill="${color}"/>`;
    });
  } else {
    const pts = values.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
    marks += `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    values.forEach((v, i) => {
      if (v != null) marks += `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" fill="#fff" stroke="${color}" stroke-width="3"/>`;
    });
  }
  return `<svg class="pm-chart" viewBox="0 0 ${w} ${h}" style="height:${h}px">
    <line x1="${pad.l}" y1="${h - pad.b}" x2="${w - pad.r}" y2="${h - pad.b}" stroke="#cdbfa8" stroke-width="2"/>
    <line x1="${pad.l}" y1="${pad.t}" x2="${w - pad.r}" y2="${pad.t}" stroke="#eadfcc" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="${pad.l - 6}" y="${pad.t + 4}" text-anchor="end" font-size="11" fill="#8a6d55">${fmt(top)}</text>
    <text x="${pad.l - 6}" y="${h - pad.b + 4}" text-anchor="end" font-size="11" fill="#8a6d55">0</text>
    ${marks}</svg>`;
}

export class ParentScreen {
  constructor(app, { profileId = null, unlocked = false } = {}) {
    this.app = app;
    this.unlocked = unlocked || !!app.debug.expose;
    this.profileId = profileId || app.store.data.lastProfile || app.store.profiles[0]?.id || null;
  }

  mount() {
    this.root = el('div', 'screen parent');
    if (this.unlocked) this.renderDashboard(); else this.renderGate();
    return this.root;
  }

  // ------------------------------------------------------------------ gate

  renderGate() {
    const a = 12 + Math.floor(Math.random() * 8);
    const b = 3 + Math.floor(Math.random() * 6);
    const answer = String(a * b);
    let typed = '';
    this.root.innerHTML = `
      <div class="pm-gate">
        <button class="btn text cream pm-back">← Back</button>
        <h1>Parents only</h1>
        <p>To open Parent Mode, answer this:</p>
        <div class="pm-question">${a} × ${b} = <span class="pm-answer">?</span></div>
        <div class="pm-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'].map((k) => `<button class="btn text cream" data-k="${k}">${k}</button>`).join('')}</div>
      </div>`;
    const out = this.root.querySelector('.pm-answer');
    this.root.querySelector('.pm-back').addEventListener('click', () => this.app.go('home'));
    this.root.querySelector('.pm-keys').addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]')?.dataset.k;
      if (k == null) return;
      if (k === '⌫') typed = typed.slice(0, -1);
      else if (k === 'OK') {
        if (typed === answer) {
          this.unlocked = true;
          this.renderDashboard();
          return;
        }
        typed = '';
        out.parentNode.classList.remove('shake');
        void out.offsetWidth;
        out.parentNode.classList.add('shake');
      } else if (typed.length < 4) typed += k;
      out.textContent = typed || '?';
    });
  }

  // ------------------------------------------------------------- dashboard

  get profile() {
    return this.app.store.profile(this.profileId);
  }

  renderDashboard() {
    const app = this.app;
    const store = app.store;
    const g = store.globals;
    const p = this.profile;
    const tabs = store.profiles.map((x) => `
      <button class="pm-tab ${x.id === this.profileId ? 'on' : ''}" data-id="${x.id}">
        <span class="pm-tab-ava">${avatarSvg(x.avatar)}</span>${escapeHtml(x.name)}
      </button>`).join('');

    this.root.innerHTML = `
      <div class="pm">
        <header class="pm-head">
          <button class="btn text cream pm-back">← Done</button>
          <h1>Parent Mode</h1>
          <div class="pm-tabs">${tabs}</div>
        </header>
        <div class="pm-body">${p ? this.childHtml(p) : '<p class="pm-empty">No child profiles yet. Go back and tap + to add one.</p>'}
          <section class="pm-card pm-wide">
            <h2>Play time (all children)</h2>
            <div class="pm-settings">
              <label>Daily session goal
                <span class="pm-range"><input type="range" min="5" max="10" step="1" value="${g.goalMin}" data-g="goalMin"><b>${g.goalMin} min</b></span>
                <small>The progress ring in the game fills over this many minutes. The spec recommends 5–10.</small>
              </label>
              <label>Daily cap
                <select data-g="capMin">${[0, 10, 15, 20, 30, 45, 60].map((m) => `<option value="${m}" ${g.capMin === m ? 'selected' : ''}>${m === 0 ? 'No cap' : `${m} minutes`}</option>`).join('')}</select>
                <small>After this much play in a day the kitchen “goes to sleep” until tomorrow.</small>
              </label>
              <label>Rest between sessions
                <select data-g="cooldownMin">${[0, 5, 10, 15, 30, 60].map((m) => `<option value="${m}" ${g.cooldownMin === m ? 'selected' : ''}>${m === 0 ? 'None' : `${m} minutes`}</option>`).join('')}</select>
                <small>A cool-down before the next session can start.</small>
              </label>
              <label class="pm-check"><input type="checkbox" data-g="sound" ${g.sound ? 'checked' : ''}> Sound effects</label>
              <label class="pm-check"><input type="checkbox" data-g="music" ${g.music ? 'checked' : ''}> Music</label>
            </div>
            <div class="pm-actions">
              <button class="btn text cream" data-act="export">Export data (JSON)</button>
            </div>
            <p class="pm-note">Everything is stored only on this device. No accounts, nothing is uploaded.</p>
          </section>
        </div>
      </div>`;

    const root = this.root;
    root.querySelector('.pm-back').addEventListener('click', () => app.go('home'));
    root.querySelector('.pm-tabs').addEventListener('click', (e) => {
      const id = e.target.closest('[data-id]')?.dataset.id;
      if (id) {
        this.profileId = id;
        this.renderDashboard();
      }
    });
    root.querySelectorAll('[data-g]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.g;
        g[key] = input.type === 'checkbox' ? input.checked : Number(input.value);
        if (key === 'sound') app.sound.setEnabled(g.sound);
        if (key === 'music') app.sound.setMusic(g.music);
        store.save();
        const b = input.parentNode.querySelector('b');
        if (b) b.textContent = `${input.value} min`;
      });
    });
    root.querySelector('[data-act="export"]').addEventListener('click', () => {
      const blob = new Blob([store.exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'little-chef-data.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    if (p) this.bindChild(p);
  }

  childHtml(p) {
    const all = aggregate(p);
    const recent = aggregate(p, 5);
    const sessions = p.stats.sessions.slice(-20);
    const o = p.settings.override;
    const dials = dialsFor(p.level, o);
    const m = masteryProgress({ level: p.level, recent: p.recent });
    const day = dayStatus(p, this.app.store.globals);
    const stat = (label, value, sub = '') => `<div class="pm-stat"><b>${value}</b><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
    const dial = (key, label, names, value, help) => `
      <label class="pm-dial">${label}
        <span class="pm-range"><input type="range" min="0" max="${names.length - 1}" step="1" value="${value}" data-dial="${key}" ${o.enabled ? '' : 'disabled'}><b>${names[value]}</b></span>
        <small>${help}</small>
      </label>`;
    return `
      <section class="pm-card">
        <h2>${escapeHtml(p.name)} – overview</h2>
        <div class="pm-stats">
          ${stat('Sessions played', all.sessions, `${Math.round(all.playMin)} min in total`)}
          ${stat('Success rate', pct(all.successRate), `last 5 sessions: ${pct(recent.successRate)}`)}
          ${stat('Avg reaction time', all.avgRt == null ? '–' : `${num(all.avgRt)} s`, 'from “ready” to the tap')}
          ${stat('Spacing-out events', all.spaceOutsPerSession == null ? '–' : `${num(all.spaceOutsPerSession)} / session`, all.spaceOutsPer10Min == null ? '' : `${num(all.spaceOutsPer10Min)} per 10 min of cooking`)}
        </div>
        <p class="pm-note">Today: ${Math.round(day.playedSec / 60)} of ${Math.round(day.goalSec / 60)} goal minutes played${day.goalMet ? ' – goal reached ✔' : ''}. Orders served perfectly: ${pct(all.perfectRate)}.</p>
        <p class="pm-note"><b>Success</b> = dish served on time or a little late (2–3 stars). <b>Spacing out</b> = 10 seconds with no touch at all while a dish is cooking; being busy with other kitchen jobs never counts.</p>
      </section>

      <section class="pm-card">
        <h2>Trends <small>(last ${sessions.length || 0} sessions)</small></h2>
        <div class="pm-charts">
          <figure><figcaption>Success rate</figcaption>${chart(sessions.map((s) => (s.orders ? s.success / s.orders : null)), { max: 1, color: '#3f9a44', fmt: () => '100%' })}</figure>
          <figure><figcaption>Reaction time (seconds)</figcaption>${chart(sessions.map((s) => s.avgRt), { color: '#4d9de0', fmt: (v) => `${v.toFixed(0)}s` })}</figure>
          <figure><figcaption>Spacing-out events</figcaption>${chart(sessions.map((s) => s.spaceOuts), { kind: 'bar', color: '#ff9a3d', fmt: (v) => v.toFixed(0) })}</figure>
          <figure><figcaption>Level at end of session</figcaption>${chart(sessions.map((s) => s.levelEnd + 1), { max: MAX_LEVEL + 1, color: '#9b6fd6', fmt: () => `${MAX_LEVEL + 1}` })}</figure>
        </div>
      </section>

      <section class="pm-card">
        <h2>Difficulty</h2>
        <div class="pm-level">
          <div><b>Level ${p.level + 1}</b> of ${MAX_LEVEL + 1} <small>· automatic · ${m.successes}/${m.window} recent orders OK, needs ${m.need} to move up</small></div>
          <div class="pm-level-btns">
            <button class="btn text cream" data-level="-1" ${o.enabled || p.level <= 0 ? 'disabled' : ''}>− Easier</button>
            <button class="btn text cream" data-level="1" ${o.enabled || p.level >= MAX_LEVEL ? 'disabled' : ''}>+ Harder</button>
          </div>
        </div>
        <p class="pm-note">Now playing with: cue <b>${CUE_NAMES[dials.cue]}</b>, wait <b>${waitLabel(dials.wait)}</b> (perfect window ${WINDOWS[dials.wait].perfect} s, then ${WINDOWS[dials.wait].grace} s grace), <b>${CONC_NAMES[dials.conc].toLowerCase()}</b>.</p>
        <label class="pm-check"><input type="checkbox" data-override ${o.enabled ? 'checked' : ''}> Set the dials myself (turns off automatic levelling)</label>
        <div class="pm-dials ${o.enabled ? '' : 'off'}">
          ${dial('cue', 'Cue strength', CUE_NAMES, o.enabled ? o.cue : dials.cue, CUE_HELP[o.enabled ? o.cue : dials.cue])}
          ${dial('wait', 'Wait length', WAIT_LEVELS.map((_, i) => waitLabel(i)), o.enabled ? o.wait : dials.wait, 'How long a dish cooks before the timed step.')}
          ${dial('conc', 'Concurrency', CONC_NAMES, o.enabled ? o.conc : dials.conc, 'Interruptions = customers asking for juice and more spills.')}
        </div>
      </section>

      <section class="pm-card">
        <h2>Options for ${escapeHtml(p.name)}</h2>
        <div class="pm-settings">
          <label>Screen layout
            <select data-set="layout">
              <option value="auto" ${p.settings.layout === 'auto' ? 'selected' : ''}>Automatic (counter view, then split kitchen for two dishes)</option>
              <option value="1" ${p.settings.layout === 1 ? 'selected' : ''}>Classic counter view</option>
              <option value="2" ${p.settings.layout === 2 ? 'selected' : ''}>Split kitchen</option>
              <option value="3" ${p.settings.layout === 3 ? 'selected' : ''}>Chef’s eye view</option>
            </select>
          </label>
          <label>Gentle idle nudge
            <select data-set="nudge">
              <option value="auto" ${p.settings.nudge === 'auto' ? 'selected' : ''}>Automatic (early levels, or after spacing out)</option>
              <option value="on" ${p.settings.nudge === 'on' ? 'selected' : ''}>Always</option>
              <option value="off" ${p.settings.nudge === 'off' ? 'selected' : ''}>Never</option>
            </select>
            <small>After a few seconds with no touch while a dish cooks, the chef looks around. It never points at the stove.</small>
          </label>
          <label>Name
            <input type="text" maxlength="12" value="${escapeHtml(p.name)}" data-set="name">
          </label>
        </div>
        <div class="pm-actions">
          <button class="btn text cream" data-act="coins">Gift 50 coins</button>
          <button class="btn text cream" data-act="tutorial">Replay the tutorial next time</button>
          <button class="btn text cream danger" data-act="reset">Reset progress</button>
          <button class="btn text cream danger" data-act="delete">Delete profile</button>
        </div>
      </section>`;
  }

  bindChild(p) {
    const store = this.app.store;
    const root = this.root;
    const rerender = () => {
      store.save();
      const top = root.querySelector('.pm-body').scrollTop;
      this.renderDashboard();
      root.querySelector('.pm-body').scrollTop = top;
    };
    root.querySelector('[data-override]').addEventListener('change', (e) => {
      const d = dialsFor(p.level, null);
      p.settings.override = { ...clampDials(p.settings.override.enabled ? p.settings.override : d), enabled: e.target.checked };
      if (e.target.checked) Object.assign(p.settings.override, d);
      rerender();
    });
    root.querySelectorAll('[data-dial]').forEach((input) => {
      input.addEventListener('change', () => {
        p.settings.override[input.dataset.dial] = Number(input.value);
        p.settings.override = { enabled: true, ...clampDials(p.settings.override) };
        rerender();
      });
    });
    root.querySelectorAll('[data-level]').forEach((b) => {
      b.addEventListener('click', () => {
        p.level = Math.max(0, Math.min(MAX_LEVEL, p.level + Number(b.dataset.level)));
        p.recent = [];
        rerender();
      });
    });
    root.querySelectorAll('[data-set]').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.dataset.set;
        if (key === 'layout') p.settings.layout = input.value === 'auto' ? 'auto' : Number(input.value);
        else if (key === 'nudge') p.settings.nudge = input.value;
        else if (key === 'name') p.name = input.value.trim().slice(0, 12) || p.name;
        rerender();
      });
    });
    const confirmTwice = (button, fn) => {
      if (button.dataset.sure) return fn();
      button.dataset.sure = '1';
      button.dataset.label = button.textContent;
      button.textContent = 'Tap again to confirm';
      setTimeout(() => {
        if (button.isConnected) {
          delete button.dataset.sure;
          button.textContent = button.dataset.label;
        }
      }, 3000);
      return null;
    };
    root.querySelector('[data-act="coins"]').addEventListener('click', () => {
      p.coins += 50;
      rerender();
    });
    root.querySelector('[data-act="tutorial"]').addEventListener('click', (e) => {
      p.tutorialDone = false;
      store.save();
      e.target.textContent = 'Tutorial will replay ✔';
    });
    root.querySelector('[data-act="reset"]').addEventListener('click', (e) => confirmTwice(e.target, () => {
      store.resetProfile(p.id);
      rerender();
    }));
    root.querySelector('[data-act="delete"]').addEventListener('click', (e) => confirmTwice(e.target, () => {
      store.removeProfile(p.id);
      this.profileId = store.profiles[0]?.id || null;
      rerender();
    }));
  }
}

void LADDER;
void icon;
