// Hub: the child's own kitchen corner. One big Play button with today's
// progress ring around it, the shop, and their chef (with pet and outfit).

import { el } from '../art/common.js';
import { chefSvg } from '../art/animals.js';
import { icon, petSvg, decorSvg } from '../art/props.js';
import { menuScene } from '../art/scene.js';
import { dayStatus } from '../../engine/stats.js';
import { MAX_LEVEL } from '../../engine/difficulty.js';

export class HubScreen {
  constructor(app, { profile }) {
    this.app = app;
    this.profile = profile;
  }

  mount() {
    const app = this.app;
    const p = this.profile;
    const day = dayStatus(p, app.store.globals);
    const root = el('div', 'screen menu hub');
    let pips = '';
    for (let i = 0; i <= MAX_LEVEL; i++) pips += `<i class="${i <= p.level ? 'on' : ''}">${icon('hat')}</i>`;
    const decor = p.equipped.decor;
    root.innerHTML = `
      <div class="layer">${menuScene(p.equipped.wall)}</div>
      ${decor.includes('bunting') ? `<div class="menu-bunting">${decorSvg('bunting')}</div>` : ''}
      ${decor.includes('lights') ? `<div class="menu-bunting lights">${decorSvg('lights')}</div>` : ''}
      ${decor.includes('picture') ? `<div class="hub-decor picture">${decorSvg('picture')}</div>` : ''}
      ${decor.includes('plant') ? `<div class="hub-decor plant">${decorSvg('plant')}</div>` : ''}
      ${decor.includes('fishbowl') ? `<div class="hub-decor fishbowl">${decorSvg('fishbowl')}</div>` : ''}
      <button class="btn round cream corner-btn back-btn">${icon('back')}</button>
      <div class="hub-coins"><span class="hud-ico">${icon('coin')}</span><span class="num">${p.coins}</span></div>
      <div class="hub-chef">${chefSvg(p.avatar, p.equipped.outfit, { expr: day.canPlay ? 'happy' : 'eating', arms: day.canPlay ? 'wave' : 'down' })}</div>
      ${p.equipped.pet ? `<div class="hub-pet">${petSvg(p.equipped.pet)}</div>` : ''}
      <div class="hub-levels">${pips}</div>
      <div class="hub-play">
        <div class="play-ring" style="--p:${day.goalProgress.toFixed(3)}"></div>
        <button class="btn round ${day.canPlay ? 'green' : 'cream disabled'} play-btn">${icon(day.canPlay ? 'play' : day.capped ? 'moon' : 'hourglass')}</button>
        ${day.goalMet ? `<div class="goal-done">${icon('check')}</div>` : ''}
      </div>
      <button class="btn round orange shop-btn">${icon('cart')}</button>`;
    root.querySelector('.back-btn').addEventListener('click', () => app.go('home'));
    root.querySelector('.shop-btn').addEventListener('click', () => {
      app.sound.play('pop');
      app.go('shop', { profile: p });
    });
    const play = root.querySelector('.play-btn');
    play.addEventListener('click', () => {
      if (!day.canPlay) return;
      app.sound.unlock();
      app.sound.play('door');
      app.go('kitchen', { profile: p });
    });
    if (!day.canPlay) {
      // The kitchen is resting: a sleepy chef, no words needed.
      root.classList.add('resting');
      root.querySelector('.hub-chef').insertAdjacentHTML('beforeend', '<div class="zzz"><b>z</b><b>z</b><b>z</b></div>');
    }
    return root;
  }
}
