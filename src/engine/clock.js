// Game clock: all timers run on this, never on wall-clock time, so cooking
// pauses when the app is backgrounded or the player hits pause.

export class GameClock {
  /**
   * @param {(dt:number)=>void} onTick  called with game seconds elapsed
   * @param {object} [env]  injectable for tests: { raf, caf, now }
   */
  constructor(onTick, env = {}) {
    this.onTick = onTick;
    this.raf = env.raf || ((fn) => requestAnimationFrame(fn));
    this.caf = env.caf || ((id) => cancelAnimationFrame(id));
    this.now = env.now || (() => performance.now());
    this.maxStep = 0.1; // never jump more than 100 ms in one frame
    this.speed = 1;
    this.running = false;
    this.pauses = new Set(); // reasons the clock is paused
    this.last = 0;
    this.handle = null;
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = this.now();
    this.handle = this.raf(this.frame);
  }

  stop() {
    this.running = false;
    if (this.handle != null) this.caf(this.handle);
    this.handle = null;
  }

  get paused() {
    return this.pauses.size > 0;
  }

  pause(reason = 'user') {
    this.pauses.add(reason);
  }

  resume(reason = 'user') {
    this.pauses.delete(reason);
    this.last = this.now();
  }

  frame() {
    if (!this.running) return;
    const now = this.now();
    const real = Math.min(this.maxStep, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (!this.paused) {
      // At high debug speeds, split into sub-steps so no phase gets skipped.
      let remaining = real * this.speed;
      while (remaining > 1e-9) {
        const dt = Math.min(this.maxStep, remaining);
        this.onTick(dt);
        remaining -= dt;
      }
    }
    this.handle = this.raf(this.frame);
  }
}
