// End of a session: stars and coins earned, each dish with its stars, and
// today's goal ring. Pictures and numbers only.

import { el } from '../art/common.js';
import { chefSvg } from '../art/animals.js';
import { icon } from '../art/props.js';
import { foodIcon } from '../art/food.js';
import { menuScene } from '../art/scene.js';
import { dayStatus } from '../../engine/stats.js';
import { Fx } from '../fx.js';

export class SummaryScreen {
  constructor(app, { profile, summary, orders = [], levelUps = 0 }) {
    this.app = app;
    this.profile = profile;
    this.summary = summary;
    this.orders = orders;
    this.levelUps = levelUps;
  }

  mount() {
    const app = this.app;
    const p = this.profile;
    const s = this.summary;
    const root = el('div', 'screen menu summary');
    if (!s) {
      // Nothing was played: straight back to the hub.
      queueMicrotask(() => app.go('hub', { profile: p }));
      return root;
    }
    const day = dayStatus(p, app.store.globals);
    const good = s.orders ? s.success / s.orders : 0;
    const mood = good >= 0.7 ? 'happy' : 'idle';
    const dishes = this.orders.slice(-16).map((o, i) => `
      <div class="sum-dish ${o.stars <= 1 ? 'burnt' : ''}" style="animation-delay:${0.5 + i * 0.07}s">
        ${foodIcon(o.recipeId)}
        <div class="sum-dish-stars">${'<i class="on"></i>'.repeat(o.stars)}${'<i></i>'.repeat(3 - o.stars)}</div>
      </div>`).join('');
    root.innerHTML = `
      <div class="layer">${menuScene(p.equipped.wall)}</div>
      <div class="sum-card pop-in">
        <div class="sum-top">
          <div class="sum-stat"><span class="sum-ico">${icon('star')}</span><span class="num big" data-count="${s.stars}">0</span></div>
          <div class="sum-stat"><span class="sum-ico">${icon('coin')}</span><span class="num big" data-count="${s.coins}">0</span></div>
          <div class="sum-ring"><div class="play-ring" style="--p:${day.goalProgress.toFixed(3)}"></div><div class="sum-ring-ico">${icon(day.goalMet ? 'check' : 'sun')}</div></div>
        </div>
        <div class="sum-dishes">${dishes}</div>
        ${this.levelUps > 0 ? `<div class="sum-level">${icon('hat')}<span>${icon('star')}</span></div>` : ''}
      </div>
      <div class="sum-chef">${chefSvg(p.avatar, p.equipped.outfit, { expr: mood, arms: good >= 0.7 ? 'up' : 'wave' })}</div>
      <div class="sum-buttons">
        <button class="btn round cream home-btn">${icon('home')}</button>
        <button class="btn round orange shop-btn">${icon('cart')}</button>
        <button class="btn round ${day.canPlay ? 'green' : 'cream disabled'} again-btn">${icon(day.canPlay ? 'play' : 'moon')}</button>
      </div>
      <div class="layer fx-layer"></div>`;
    root.querySelector('.home-btn').addEventListener('click', () => app.go('hub', { profile: p }));
    root.querySelector('.shop-btn').addEventListener('click', () => app.go('shop', { profile: p }));
    root.querySelector('.again-btn').addEventListener('click', () => {
      if (day.canPlay) app.go('kitchen', { profile: p });
    });

    const fx = new Fx(root.querySelector('.fx-layer'));
    setTimeout(() => {
      app.sound.play('fanfare');
      if (good >= 0.5) fx.confetti(good >= 0.8 ? 90 : 40);
    }, 250);
    // Count the numbers up.
    for (const node of root.querySelectorAll('[data-count]')) {
      const target = Number(node.dataset.count);
      const t0 = performance.now();
      const step = (now) => {
        const f = Math.min(1, (now - t0 - 400) / 1100);
        node.textContent = Math.round(target * Math.max(0, f));
        if (f < 1 && node.isConnected) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    return root;
  }
}
