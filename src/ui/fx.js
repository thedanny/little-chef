// Little juicy effects: things that fly, burst and sparkle. All positions are
// in stage coordinates (the 1280×800 logical space).

import { el, star, svg, C } from './art/common.js';

export class Fx {
  constructor(layer) {
    this.layer = layer;
  }

  /** Fly a picture from one spot to another along a little arc. */
  fly(html, from, to, { dur = 650, size = 60, endSize = size, arc = 90, delay = 0, spin = 0, onDone = null, z = 50 } = {}) {
    const node = el('div', 'fx-fly', html);
    node.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;z-index:${z};pointer-events:none;will-change:transform;`;
    this.layer.append(node);
    const x0 = from.x - size / 2;
    const y0 = from.y - size / 2;
    const x1 = to.x - size / 2;
    const y1 = to.y - size / 2;
    const s1 = endSize / size;
    const mx = (x0 + x1) / 2;
    const my = Math.min(y0, y1) - arc;
    const anim = node.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.4) rotate(0deg)`, opacity: 0, offset: 0 },
      { transform: `translate(${x0}px,${y0}px) scale(1) rotate(0deg)`, opacity: 1, offset: 0.12 },
      { transform: `translate(${mx}px,${my}px) scale(${(1 + s1) / 2 + 0.15}) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${x1}px,${y1}px) scale(${s1}) rotate(${spin}deg)`, opacity: 1, offset: 1 },
    ], { duration: dur, delay, easing: 'ease-in-out', fill: 'both' });
    anim.onfinish = () => {
      node.remove();
      if (onDone) onDone();
    };
    return node;
  }

  /** A burst of small shapes from a point. */
  burst(x, y, { count = 10, colors = [C.yellow, '#fff', C.orange], spread = 90, size = 18, kind = 'star', dur = 700 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const d = spread * (0.5 + Math.random() * 0.6);
      const color = colors[i % colors.length];
      const s = size * (0.6 + Math.random() * 0.8);
      const inner = kind === 'star'
        ? svg('0 0 100 100', star(50, 52, 42, color, 7))
        : `<div style="width:100%;height:100%;border-radius:${kind === 'dot' ? '50%' : '4px'};background:${color};border:2px solid #4a2b17"></div>`;
      const node = el('div', 'fx-bit', inner);
      node.style.cssText = `position:absolute;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;z-index:60;pointer-events:none;`;
      this.layer.append(node);
      const anim = node.animate([
        { transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 20}px) scale(1) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(a) * d * 1.15}px,${Math.sin(a) * d + 30}px) scale(.3) rotate(${Math.random() * 360}deg)`, opacity: 0 },
      ], { duration: dur + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
      anim.onfinish = () => node.remove();
    }
  }

  /** A picture that pops up, floats and fades (e.g. the action just done). */
  float(html, x, y, { size = 70, rise = 70, dur = 900 } = {}) {
    const node = el('div', 'fx-float', html);
    node.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;z-index:55;pointer-events:none;`;
    this.layer.append(node);
    const anim = node.animate([
      { transform: 'translateY(10px) scale(.3)', opacity: 0 },
      { transform: 'translateY(0) scale(1.15)', opacity: 1, offset: 0.25 },
      { transform: `translateY(${-rise * 0.7}px) scale(1)`, opacity: 1, offset: 0.7 },
      { transform: `translateY(${-rise}px) scale(.9)`, opacity: 0 },
    ], { duration: dur, easing: 'ease-out', fill: 'both' });
    anim.onfinish = () => node.remove();
  }

  /** Smoke / dust puff. */
  puff(x, y, { color = '#8a8f98', count = 7, size = 46 } = {}) {
    for (let i = 0; i < count; i++) {
      const node = el('div', 'fx-puff');
      const s = size * (0.6 + Math.random() * 0.8);
      node.style.cssText = `position:absolute;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${color};border:3px solid #4a2b17;z-index:58;pointer-events:none;`;
      this.layer.append(node);
      const dx = (Math.random() - 0.5) * 150;
      const dy = -30 - Math.random() * 90;
      const anim = node.animate([
        { transform: 'translate(0,0) scale(.3)', opacity: 0.95 },
        { transform: `translate(${dx}px,${dy}px) scale(1.3)`, opacity: 0 },
      ], { duration: 700 + Math.random() * 500, easing: 'ease-out', fill: 'both' });
      anim.onfinish = () => node.remove();
    }
  }

  /** Full-stage confetti for big moments. */
  confetti(count = 70) {
    const colors = [C.red, C.yellow, C.blue, C.green, C.pink, C.purple, C.orange];
    for (let i = 0; i < count; i++) {
      const node = el('div', 'fx-confetti');
      const w = 10 + Math.random() * 12;
      const x = Math.random() * 1280;
      node.style.cssText = `position:absolute;left:${x}px;top:-30px;width:${w}px;height:${w * 0.6}px;background:${colors[i % colors.length]};border:2px solid #4a2b17;border-radius:3px;z-index:90;pointer-events:none;`;
      this.layer.append(node);
      const anim = node.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${(Math.random() - 0.5) * 260}px,${860}px) rotate(${(Math.random() - 0.5) * 1400}deg)`, opacity: 1 },
      ], { duration: 1800 + Math.random() * 1600, delay: Math.random() * 500, easing: 'cubic-bezier(.3,.2,.6,1)', fill: 'both' });
      anim.onfinish = () => node.remove();
    }
  }
}
