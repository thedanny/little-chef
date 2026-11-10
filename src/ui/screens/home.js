// Home: pick who is playing (by picture), add a new chef, or open Parent Mode.

import { el, ink, svg, C } from '../art/common.js';
import { avatarSvg, chefBustSvg, chefSvg, SPECIES } from '../art/animals.js';
import { icon, decorSvg } from '../art/props.js';
import { menuScene } from '../art/scene.js';
import { foodIcon } from '../art/food.js';
import { AVATARS } from '../../engine/storage.js';

export function logoSvg() {
  return svg('0 0 620 210', `
    <g transform="translate(18 6) scale(1.5)">
      <path d="M26 60 q-22 -10 -10 -32 q4 -22 28 -16 q8 -10 22 0 q22 -6 26 16 q12 22 -10 32z" fill="#fff" ${ink(5)}/>
      <rect x="24" y="56" width="52" height="24" rx="6" fill="#fff" ${ink(5)}/>
      <path d="M40 30 q2 10 0 20 M50 24 v26 M60 30 q-2 10 0 20" fill="none" stroke="#d7dde3" stroke-width="3" stroke-linecap="round"/>
    </g>
    <text x="170" y="100" font-family="ui-rounded, 'Arial Rounded MT Bold', 'Nunito', system-ui, sans-serif" font-weight="900" font-size="96" fill="${C.red}" stroke="#4a2b17" stroke-width="14" stroke-linejoin="round" paint-order="stroke fill">Little</text>
    <text x="230" y="188" font-family="ui-rounded, 'Arial Rounded MT Bold', 'Nunito', system-ui, sans-serif" font-weight="900" font-size="96" fill="${C.yellow}" stroke="#4a2b17" stroke-width="14" stroke-linejoin="round" paint-order="stroke fill">Chef</text>`);
}

export class HomeScreen {
  constructor(app) {
    this.app = app;
  }

  mount() {
    const app = this.app;
    const root = el('div', 'screen menu home');
    root.innerHTML = `
      <div class="layer">${menuScene('sunny')}</div>
      <div class="menu-bunting">${decorSvg('bunting')}</div>
      <div class="logo">${logoSvg()}</div>
      <div class="home-food f1">${foodIcon('pancakes')}</div>
      <div class="home-food f2">${foodIcon('toast')}</div>
      <div class="home-food f3">${foodIcon('mac')}</div>
      <div class="profiles"></div>
      <button class="btn round cream corner-btn parent-btn" aria-label="Parents">${icon('gear')}<span class="mini-lock">${icon('lock')}</span></button>
      <button class="btn round cream corner-btn full-btn" aria-label="Full screen">${icon('full')}</button>`;
    const list = root.querySelector('.profiles');
    for (const p of app.store.profiles) {
      const card = el('button', 'pcard', `
        <div class="pcard-art">${chefBustSvg(p.avatar, p.equipped.outfit, { expr: 'happy' })}</div>
        <div class="pcard-name">${escapeHtml(p.name)}</div>`);
      card.addEventListener('click', () => {
        app.sound.play('pop');
        app.store.data.lastProfile = p.id;
        app.store.save();
        app.go('hub', { profile: p });
      });
      list.append(card);
    }
    if (app.store.profiles.length < 6) {
      const add = el('button', 'pcard add', `<div class="pcard-art plus">${icon('plus')}</div>`);
      add.setAttribute('aria-label', 'Add a chef');
      add.addEventListener('click', () => {
        app.sound.play('pop');
        app.go('create');
      });
      list.append(add);
    }
    root.querySelector('.parent-btn').addEventListener('click', () => app.go('parent'));
    root.querySelector('.full-btn').addEventListener('click', () => app.toggleFullscreen());
    return root;
  }
}

export class CreateScreen {
  constructor(app) {
    this.app = app;
    this.avatar = AVATARS.find((a) => !app.store.profiles.some((p) => p.avatar === a)) || AVATARS[0];
  }

  mount() {
    const app = this.app;
    const root = el('div', 'screen menu create');
    root.innerHTML = `
      <div class="layer">${menuScene('mint')}</div>
      <button class="btn round cream corner-btn back-btn">${icon('back')}</button>
      <div class="create-preview"></div>
      <div class="create-grid"></div>
      <div class="create-row">
        <input class="name-input" type="text" maxlength="12" placeholder="Name" autocomplete="off" autocapitalize="words" spellcheck="false">
        <button class="btn round green ok-btn">${icon('check')}</button>
      </div>`;
    const grid = root.querySelector('.create-grid');
    const preview = root.querySelector('.create-preview');
    const input = root.querySelector('.name-input');
    const show = () => {
      preview.innerHTML = chefSvg(this.avatar, 'classic', { expr: 'happy', arms: 'up' });
      for (const t of grid.children) t.classList.toggle('on', t.dataset.id === this.avatar);
    };
    for (const id of AVATARS) {
      const tile = el('button', 'avatar-tile', avatarSvg(id));
      tile.dataset.id = id;
      tile.style.setProperty('--fur', SPECIES[id].fur);
      tile.addEventListener('click', () => {
        this.avatar = id;
        app.sound.play('hello', { pitch: AVATARS.indexOf(id) - 3 });
        show();
      });
      grid.append(tile);
    }
    show();
    root.querySelector('.back-btn').addEventListener('click', () => app.go('home'));
    root.querySelector('.ok-btn').addEventListener('click', () => {
      const name = input.value.trim() || this.avatar[0].toUpperCase() + this.avatar.slice(1);
      const p = app.store.addProfile({ name, avatar: this.avatar });
      app.store.data.lastProfile = p.id;
      app.store.save();
      app.sound.play('levelup');
      app.go('hub', { profile: p });
    });
    return root;
  }
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
