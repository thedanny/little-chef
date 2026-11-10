// Shop: spend coins on recipes, chef outfits, pets, wall colours and
// decorations. Picture cards with a coin price – nothing to read.

import { el } from '../art/common.js';
import { chefSvg, chefBustSvg } from '../art/animals.js';
import { icon, petSvg, decorSvg } from '../art/props.js';
import { foodIcon } from '../art/food.js';
import { menuScene, wallSwatch } from '../art/scene.js';
import { SHOP_TABS, itemsOfKind, owns, isEquipped, buy, equip } from '../../engine/catalog.js';
import { BASE_RECIPES, RECIPES } from '../../engine/recipes.js';
import { Fx } from '../fx.js';

const TAB_ICON = { recipe: 'fork', outfit: 'hat', pet: 'paw', wall: 'brush', decor: 'frame' };

export class ShopScreen {
  constructor(app, { profile }) {
    this.app = app;
    this.profile = profile;
    this.tab = 'recipe';
  }

  preview(item) {
    const p = this.profile;
    switch (item.kind) {
      case 'recipe': return foodIcon(item.id);
      case 'outfit': return chefBustSvg(p.avatar, item.id, { expr: 'happy' });
      case 'pet': return petSvg(item.id);
      case 'wall': return wallSwatch(item.id);
      default: return decorSvg(item.id);
    }
  }

  mount() {
    const app = this.app;
    const p = this.profile;
    const root = (this.root = el('div', 'screen menu shop'));
    root.innerHTML = `
      <div class="layer shop-bg"></div>
      <button class="btn round cream corner-btn back-btn">${icon('back')}</button>
      <div class="hub-coins"><span class="hud-ico">${icon('coin')}</span><span class="num"></span></div>
      <div class="shop-chef"></div>
      <div class="shop-pet"></div>
      <div class="shop-panel">
        <div class="shop-tabs"></div>
        <div class="shop-grid"></div>
      </div>
      <div class="layer fx-layer"></div>`;
    this.fx = new Fx(root.querySelector('.fx-layer'));
    const tabs = root.querySelector('.shop-tabs');
    for (const t of SHOP_TABS) {
      const b = el('button', 'btn small cream shop-tab', icon(TAB_ICON[t]));
      b.dataset.tab = t;
      b.addEventListener('click', () => {
        this.tab = t;
        app.sound.play('tap');
        this.refresh();
      });
      tabs.append(b);
    }
    root.querySelector('.back-btn').addEventListener('click', () => app.go('hub', { profile: p }));
    this.refresh();
    return root;
  }

  refresh() {
    const app = this.app;
    const p = this.profile;
    const root = this.root;
    root.querySelector('.shop-bg').innerHTML = menuScene(p.equipped.wall);
    root.querySelector('.hub-coins .num').textContent = p.coins;
    root.querySelector('.shop-chef').innerHTML = chefSvg(p.avatar, p.equipped.outfit, { expr: 'happy', arms: 'wave' });
    root.querySelector('.shop-pet').innerHTML = p.equipped.pet ? petSvg(p.equipped.pet) : '';
    for (const b of root.querySelectorAll('.shop-tab')) b.classList.toggle('on', b.dataset.tab === this.tab);
    const grid = root.querySelector('.shop-grid');
    grid.innerHTML = '';
    let items = itemsOfKind(this.tab);
    if (this.tab === 'recipe') {
      items = [...BASE_RECIPES.map((id) => ({ id, kind: 'recipe', price: 0 })), ...items];
    }
    for (const item of items) {
      const have = owns(p, item.id);
      const on = have && isEquipped(p, item.id);
      const afford = p.coins >= item.price;
      const card = el('button', `shop-card ${have ? 'owned' : afford ? 'can' : 'cannot'} ${on ? 'on' : ''}`, `
        <div class="shop-art">${this.preview(item)}</div>
        ${have
          ? `<div class="shop-tag ${on ? 'on' : ''}">${on ? icon('check') : ''}</div>`
          : `<div class="shop-price"><span class="hud-ico">${icon('coin')}</span><span class="num">${item.price}</span></div>`}
        ${!have && !afford ? `<div class="shop-lock">${icon('lock')}</div>` : ''}`);
      if (item.kind === 'recipe' && RECIPES[item.id]) card.dataset.station = RECIPES[item.id].station;
      card.addEventListener('click', () => this.pick(item, card));
      grid.append(card);
    }
  }

  pick(item, card) {
    const app = this.app;
    const p = this.profile;
    if (owns(p, item.id)) {
      if (item.kind === 'recipe') {
        app.sound.play('tap');
        return;
      }
      // A classic hat and a sunny wall are the "nothing special" defaults.
      equip(p, item.id);
      app.sound.play('pop');
    } else if (buy(p, item.id)) {
      app.sound.play('buy');
      const r = card.getBoundingClientRect();
      const s = this.root.getBoundingClientRect();
      const k = 1280 / s.width;
      this.fx.burst((r.left + r.width / 2 - s.left) * k, (r.top + r.height / 2 - s.top) * k, { count: 14, spread: 130 });
      this.fx.confetti(30);
    } else {
      app.sound.play('nope');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      return;
    }
    app.store.save();
    this.refresh();
  }
}
