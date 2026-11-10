// All sound is synthesised with WebAudio: no audio files.
// Each station has its own cooking sound and its own "ready" motif so the
// audio cues are learnable (stove bubbles, griddle sizzles, toaster dings…).

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicOn = true;
    this.loops = new Map(); // stationId → { stop, setLevel }
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicNext = 0;
    this.noiseBuf = null;
  }

  /** Must be called from a user gesture before any sound can play. */
  unlock() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? 1 : 0;
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended' && !this.held) this.ctx.resume();
    if (this.wantMusic && !this.musicTimer) this.startMusic();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running' && this.enabled;
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.9 : 0;
  }

  setMusic(on) {
    this.musicOn = on;
    if (this.musicGain) this.musicGain.gain.value = on ? 1 : 0;
  }

  /** Freeze all audio (game paused / app in background). */
  hold(on) {
    this.held = on;
    if (!this.ctx) return;
    if (on) this.ctx.suspend(); else this.ctx.resume();
  }

  // ------------------------------------------------------------ primitives

  tone({ f = 440, to = null, type = 'sine', dur = 0.15, vol = 0.2, at = 0, attack = 0.005, vib = 0, out = null }) {
    if (!this.ready) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    if (vib) {
      const l = c.createOscillator();
      const lg = c.createGain();
      l.frequency.value = vib;
      lg.gain.value = f * 0.04;
      l.connect(lg).connect(o.frequency);
      l.start(t);
      l.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out || this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise({ dur = 0.2, vol = 0.2, at = 0, type = 'bandpass', f = 3000, to = null, q = 1, attack = 0.01 }) {
    if (!this.ready) return;
    const c = this.ctx;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(f, t);
    if (to) filt.frequency.exponentialRampToValueAtTime(to, t + dur);
    filt.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(g).connect(this.sfx);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  bell(f, at = 0, vol = 0.22, dur = 0.9) {
    this.tone({ f, dur, vol, at, type: 'sine' });
    this.tone({ f: f * 2.01, dur: dur * 0.6, vol: vol * 0.35, at, type: 'sine' });
    this.tone({ f: f * 3.02, dur: dur * 0.3, vol: vol * 0.15, at, type: 'sine' });
  }

  seq(notes, { type = 'triangle', step = 0.1, dur = 0.14, vol = 0.2, at = 0 } = {}) {
    notes.forEach((n, i) => {
      if (n != null) this.tone({ f: NOTE(n), type, dur, vol, at: at + i * step });
    });
  }

  // ---------------------------------------------------------- interface fx

  play(name, o = {}) {
    if (!this.ready) return;
    const v = o.vol ?? 1;
    switch (name) {
      case 'tap': this.tone({ f: 620, to: 900, dur: 0.07, vol: 0.12 * v }); break;
      case 'nope':
        this.tone({ f: 220, dur: 0.1, vol: 0.14 * v, type: 'square' });
        this.tone({ f: 170, dur: 0.14, vol: 0.14 * v, type: 'square', at: 0.11 });
        break;
      case 'pop': this.tone({ f: 380, to: 980, dur: 0.09, vol: 0.2 * v }); break;
      case 'door':
        this.bell(NOTE(88), 0, 0.14 * v, 0.5);
        this.bell(NOTE(84), 0.14, 0.14 * v, 0.6);
        break;
      case 'hello': {
        const base = 60 + (o.pitch ?? 0);
        this.tone({ f: NOTE(base + 7), to: NOTE(base + 12), dur: 0.12, vol: 0.18 * v, type: 'triangle' });
        this.tone({ f: NOTE(base + 12), to: NOTE(base + 16), dur: 0.16, vol: 0.18 * v, type: 'triangle', at: 0.13 });
        break;
      }
      case 'coin':
        this.tone({ f: NOTE(83), dur: 0.07, vol: 0.12 * v, type: 'square' });
        this.tone({ f: NOTE(88), dur: 0.22, vol: 0.12 * v, type: 'square', at: 0.07 });
        break;
      case 'star':
        this.tone({ f: NOTE(91), to: NOTE(96), dur: 0.2, vol: 0.16 * v });
        this.tone({ f: NOTE(103), dur: 0.25, vol: 0.07 * v, at: 0.05 });
        break;
      case 'peek': this.tone({ f: 520, to: 440, dur: 0.12, vol: 0.1 * v, type: 'triangle' }); break;
      case 'nudge':
        this.tone({ f: NOTE(76), dur: 0.14, vol: 0.12 * v, type: 'triangle' });
        this.tone({ f: NOTE(79), dur: 0.2, vol: 0.12 * v, type: 'triangle', at: 0.18 });
        break;
      case 'need':
        this.tone({ f: NOTE(72), dur: 0.1, vol: 0.14 * v, type: 'triangle' });
        this.tone({ f: NOTE(72), dur: 0.1, vol: 0.14 * v, type: 'triangle', at: 0.14 });
        break;

      // chores
      case 'wash':
        this.noise({ f: 1800, to: 3600, dur: 0.3, vol: 0.14 * v, q: 0.8 });
        this.noise({ f: 3600, to: 1800, dur: 0.3, vol: 0.14 * v, q: 0.8, at: 0.3 });
        this.tone({ f: 500, to: 900, dur: 0.08, vol: 0.06 * v, at: 0.2 });
        this.tone({ f: 700, to: 1200, dur: 0.08, vol: 0.06 * v, at: 0.5 });
        break;
      case 'washed':
        this.tone({ f: 1500, to: 2300, dur: 0.12, vol: 0.12 * v });
        this.tone({ f: NOTE(96), dur: 0.3, vol: 0.08 * v, at: 0.1 });
        break;
      case 'fridge':
        this.tone({ f: 110, to: 70, dur: 0.14, vol: 0.3 * v });
        this.noise({ f: 500, dur: 0.1, vol: 0.12 * v, type: 'lowpass' });
        break;
      case 'restocked': this.seq([72, 76, 79], { step: 0.07, dur: 0.1, vol: 0.14 * v }); break;
      case 'scrub': this.noise({ f: 2400, to: 4200, dur: 0.16, vol: 0.16 * v, q: 1.2 }); break;
      case 'wiped':
        this.noise({ f: 2400, to: 5000, dur: 0.18, vol: 0.14 * v, q: 1.2 });
        this.tone({ f: NOTE(93), dur: 0.25, vol: 0.1 * v, at: 0.1 });
        this.tone({ f: NOTE(100), dur: 0.25, vol: 0.07 * v, at: 0.18 });
        break;
      case 'spill': this.tone({ f: 420, to: 160, dur: 0.22, vol: 0.14 * v }); this.noise({ f: 900, dur: 0.14, vol: 0.08 * v, type: 'lowpass', at: 0.12 }); break;
      case 'juice':
        for (let i = 0; i < 4; i++) this.tone({ f: 260 + i * 60, to: 180 + i * 60, dur: 0.09, vol: 0.14 * v, at: i * 0.09 });
        break;
      case 'thirsty': this.tone({ f: NOTE(79), to: NOTE(74), dur: 0.22, vol: 0.12 * v, type: 'triangle', vib: 9 }); break;
      case 'plate': this.tone({ f: 2100, dur: 0.07, vol: 0.12 * v }); this.tone({ f: 3150, dur: 0.05, vol: 0.06 * v }); break;

      // customer reactions
      case 'happy':
        this.tone({ f: NOTE(76), to: NOTE(88), dur: 0.26, vol: 0.18 * v, type: 'triangle', vib: 11 });
        this.seq([84, 88, 91, 96], { step: 0.08, dur: 0.16, vol: 0.12 * v, at: 0.2, type: 'sine' });
        break;
      case 'ok': this.seq([72, 76], { step: 0.12, dur: 0.16, vol: 0.14 * v }); break;
      case 'grumpy':
        this.tone({ f: 320, to: 140, dur: 0.4, vol: 0.14 * v, type: 'sawtooth', vib: 7 });
        this.tone({ f: 200, to: 110, dur: 0.3, vol: 0.1 * v, type: 'sawtooth', at: 0.4 });
        break;
      case 'sad': this.seq([67, 63, 60], { step: 0.2, dur: 0.26, vol: 0.14 * v }); break;
      case 'munch':
        for (let i = 0; i < 3; i++) this.noise({ f: 900, dur: 0.07, vol: 0.1 * v, type: 'lowpass', at: i * 0.22 });
        break;

      // outcomes
      case 'served3': this.seq([79, 84, 88, 91], { step: 0.08, dur: 0.18, vol: 0.16 * v }); this.bell(NOTE(96), 0.32, 0.12 * v, 0.6); break;
      case 'served2': this.seq([76, 79, 84], { step: 0.1, dur: 0.16, vol: 0.14 * v }); break;
      case 'served1':
        // The classic funny "wah wah wah".
        [58, 57, 56].forEach((n, i) => this.tone({ f: NOTE(n), to: NOTE(n - 0.6), dur: 0.26, vol: 0.12 * v, type: 'sawtooth', at: i * 0.28, vib: 6 }));
        this.tone({ f: NOTE(55), to: NOTE(50), dur: 0.6, vol: 0.12 * v, type: 'sawtooth', at: 0.84, vib: 7 });
        break;
      case 'burnt':
        this.noise({ f: 1200, to: 300, dur: 0.5, vol: 0.2 * v, type: 'lowpass' });
        this.tone({ f: 180, to: 70, dur: 0.4, vol: 0.2 * v, type: 'triangle' });
        break;
      case 'poof': this.noise({ f: 800, to: 200, dur: 0.35, vol: 0.2 * v, type: 'lowpass' }); break;
      case 'levelup':
        this.seq([72, 76, 79, 84, 88, 91, 96], { step: 0.09, dur: 0.2, vol: 0.16 * v, type: 'triangle' });
        this.seq([60, null, 67, null, 72], { step: 0.18, dur: 0.3, vol: 0.12 * v, type: 'square' });
        this.bell(NOTE(96), 0.7, 0.14 * v, 1.2);
        break;
      case 'leveldown': this.seq([76, 72, 69], { step: 0.14, dur: 0.2, vol: 0.1 * v }); break;
      case 'fanfare':
        this.seq([72, 72, 72, 76, 79, null, 76, 79, 84], { step: 0.13, dur: 0.22, vol: 0.16 * v, type: 'triangle' });
        this.seq([48, null, null, 52, 55, null, 52, 55, 60], { step: 0.13, dur: 0.3, vol: 0.1 * v, type: 'square' });
        this.bell(NOTE(96), 1.1, 0.14 * v, 1.4);
        break;
      case 'buy': this.seq([84, 88, 91, 96], { step: 0.06, dur: 0.14, vol: 0.14 * v, type: 'square' }); break;
      case 'closing': this.bell(NOTE(81), 0, 0.14 * v, 0.9); this.bell(NOTE(77), 0.3, 0.14 * v, 0.9); this.bell(NOTE(72), 0.6, 0.14 * v, 1.2); break;
      default: break;
    }
  }

  /** The sound of doing a cooking step. */
  action(action, vol = 1) {
    if (!this.ready) return;
    const v = vol;
    switch (action) {
      case 'pour': this.noise({ f: 3800, dur: 0.5, vol: 0.18 * v, q: 0.7 }); this.tone({ f: 300, to: 200, dur: 0.25, vol: 0.1 * v }); break;
      case 'place': this.noise({ f: 4200, dur: 0.4, vol: 0.16 * v, q: 0.7 }); this.tone({ f: 160, dur: 0.08, vol: 0.18 * v }); break;
      case 'boil':
      case 'veggies':
        for (let i = 0; i < 4; i++) this.tone({ f: 320 + Math.random() * 200, to: 120, dur: 0.12, vol: 0.16 * v, at: i * 0.07 });
        this.noise({ f: 1400, dur: 0.25, vol: 0.1 * v, type: 'lowpass' });
        break;
      case 'insert': this.tone({ f: 120, to: 80, dur: 0.1, vol: 0.3 * v, type: 'square' }); this.noise({ f: 2500, dur: 0.05, vol: 0.14 * v, at: 0.08 }); break;
      case 'drop': this.noise({ f: 5000, dur: 0.6, vol: 0.2 * v, q: 0.6 }); this.tone({ f: 500, dur: 0.05, vol: 0.1 * v, type: 'square' }); break;
      case 'tray': this.tone({ f: 130, to: 90, dur: 0.16, vol: 0.28 * v }); this.tone({ f: 1320, dur: 0.1, vol: 0.1 * v, at: 0.2, type: 'square' }); break;
      case 'flip':
        this.noise({ f: 800, to: 3200, dur: 0.18, vol: 0.14 * v, q: 0.8 });
        this.tone({ f: 200, to: 110, dur: 0.1, vol: 0.2 * v, at: 0.26 });
        this.noise({ f: 4000, dur: 0.25, vol: 0.14 * v, q: 0.7, at: 0.28 });
        break;
      case 'drain':
        this.noise({ f: 2600, to: 900, dur: 0.7, vol: 0.18 * v, q: 0.5 });
        for (let i = 0; i < 4; i++) this.tone({ f: 700 - i * 90, to: 300, dur: 0.1, vol: 0.07 * v, at: 0.1 + i * 0.12 });
        break;
      case 'cheese': this.tone({ f: 300, to: 520, dur: 0.16, vol: 0.16 * v, type: 'triangle' }); this.tone({ f: 420, to: 700, dur: 0.16, vol: 0.14 * v, type: 'triangle', at: 0.14 }); break;
      case 'pop': this.tone({ f: 200, to: 1400, dur: 0.12, vol: 0.2 * v, type: 'triangle' }); this.bell(NOTE(100), 0.1, 0.14 * v, 0.5); break;
      case 'butter': this.noise({ f: 1200, to: 2200, dur: 0.25, vol: 0.1 * v, q: 1.5 }); this.noise({ f: 2200, to: 1200, dur: 0.25, vol: 0.1 * v, q: 1.5, at: 0.22 }); break;
      case 'stir':
        this.noise({ f: 700, to: 1400, dur: 0.22, vol: 0.14 * v, q: 1 });
        this.noise({ f: 1400, to: 700, dur: 0.22, vol: 0.14 * v, q: 1, at: 0.22 });
        this.tone({ f: 900, dur: 0.04, vol: 0.08 * v, at: 0.2, type: 'square' });
        break;
      case 'ladle': this.tone({ f: 480, to: 200, dur: 0.16, vol: 0.18 * v }); this.tone({ f: 380, to: 160, dur: 0.16, vol: 0.14 * v, at: 0.22 }); break;
      case 'lift': for (let i = 0; i < 4; i++) this.noise({ f: 5200, dur: 0.05, vol: 0.14 * v, q: 3, at: i * 0.06 }); this.noise({ f: 3000, to: 1200, dur: 0.4, vol: 0.1 * v, at: 0.2 }); break;
      case 'salt': for (let i = 0; i < 3; i++) this.noise({ f: 6500, dur: 0.06, vol: 0.14 * v, q: 2, at: i * 0.13 }); break;
      case 'takeout': this.tone({ f: 120, to: 80, dur: 0.14, vol: 0.26 * v }); this.bell(NOTE(93), 0.16, 0.12 * v, 0.5); break;
      case 'sprinkle': for (let i = 0; i < 6; i++) this.tone({ f: NOTE(96 + Math.floor(Math.random() * 12)), dur: 0.08, vol: 0.07 * v, at: i * 0.05 }); break;
      case 'plate':
      case 'serve': this.play('plate', { vol: v }); break;
      default: this.play('pop', { vol: v });
    }
  }

  /** Each station's own "it's ready!" motif. */
  cue(stationId, vol = 1) {
    if (!this.ready) return;
    const v = vol;
    switch (stationId) {
      case 'stove': // rising bloops
        [72, 76, 79].forEach((n, i) => this.tone({ f: NOTE(n) * 0.7, to: NOTE(n), dur: 0.14, vol: 0.2 * v, at: i * 0.13 }));
        break;
      case 'griddle': // sizzle + two notes
        this.noise({ f: 5000, dur: 0.2, vol: 0.12 * v, q: 0.8 });
        this.tone({ f: NOTE(74), dur: 0.14, vol: 0.2 * v, type: 'triangle', at: 0.05 });
        this.tone({ f: NOTE(81), dur: 0.24, vol: 0.2 * v, type: 'triangle', at: 0.2 });
        break;
      case 'toaster': // one clear ding
        this.bell(NOTE(93), 0, 0.24 * v, 1.0);
        break;
      case 'fryer': // beep beep beep
        for (let i = 0; i < 3; i++) this.tone({ f: NOTE(83), dur: 0.09, vol: 0.12 * v, type: 'square', at: i * 0.15 });
        break;
      case 'oven': // ding-dong
        this.bell(NOTE(88), 0, 0.2 * v, 0.7);
        this.bell(NOTE(84), 0.3, 0.2 * v, 0.9);
        break;
      default:
        this.bell(NOTE(90), 0, 0.2 * v);
    }
  }

  /** Urgent "about to burn" beeps. */
  alarm(vol = 1) {
    this.tone({ f: 1250, dur: 0.09, vol: 0.12 * vol, type: 'square' });
    this.tone({ f: 1250, dur: 0.09, vol: 0.12 * vol, type: 'square', at: 0.14 });
  }

  // ----------------------------------------------------------- cook loops

  /** Start/stop/adjust the ambient cooking sound for a station (level 0..1). */
  cooking(stationId, level) {
    if (!this.ctx) return;
    let loop = this.loops.get(stationId);
    if (level <= 0) {
      if (loop) {
        loop.stop();
        this.loops.delete(stationId);
      }
      return;
    }
    if (!loop) {
      loop = this.makeLoop(stationId);
      this.loops.set(stationId, loop);
    }
    loop.setLevel(level);
  }

  stopAllLoops() {
    for (const loop of this.loops.values()) loop.stop();
    this.loops.clear();
  }

  makeLoop(stationId) {
    const c = this.ctx;
    const gain = c.createGain();
    gain.gain.value = 0;
    gain.connect(this.sfx);
    const nodes = [];
    let timer = null;
    let level = 0;
    const hiss = (f, q, vol) => {
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = f;
      filt.Q.value = q;
      const g = c.createGain();
      g.gain.value = vol;
      // Slow wobble so it sounds alive.
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 3 + Math.random() * 4;
      lg.gain.value = vol * 0.5;
      lfo.connect(lg).connect(g.gain);
      src.connect(filt).connect(g).connect(gain);
      src.start(0, Math.random());
      lfo.start();
      nodes.push(src, lfo);
    };
    const every = (ms, fn) => {
      timer = setInterval(() => {
        if (this.ready && level > 0) fn();
      }, ms);
    };
    const blip = (f, to, dur, vol, type = 'sine') => this.tone({ f, to, dur, vol: vol * level, type });
    switch (stationId) {
      case 'stove':
        hiss(600, 0.6, 0.03);
        every(170, () => { if (Math.random() < 0.7) blip(200 + Math.random() * 260, 520 + Math.random() * 300, 0.07, 0.09); });
        break;
      case 'griddle':
        hiss(5200, 0.5, 0.075);
        every(210, () => { if (Math.random() < 0.4) this.noise({ f: 7000, dur: 0.03, vol: 0.09 * level, q: 4 }); });
        break;
      case 'toaster':
        hiss(240, 2, 0.03);
        every(430, () => blip(1900, 1500, 0.025, 0.08, 'square'));
        break;
      case 'fryer':
        hiss(3600, 0.4, 0.085);
        every(150, () => { if (Math.random() < 0.5) blip(500 + Math.random() * 500, 1200, 0.04, 0.05); });
        break;
      case 'oven': {
        const hum = c.createOscillator();
        const hg = c.createGain();
        hum.type = 'triangle';
        hum.frequency.value = 92;
        hg.gain.value = 0.07;
        hum.connect(hg).connect(gain);
        hum.start();
        nodes.push(hum);
        hiss(900, 0.3, 0.02);
        break;
      }
      default:
        hiss(2000, 0.5, 0.05);
    }
    return {
      setLevel: (l) => {
        level = l;
        gain.gain.setTargetAtTime(l, c.currentTime, 0.15);
      },
      stop: () => {
        if (timer) clearInterval(timer);
        gain.gain.setTargetAtTime(0, c.currentTime, 0.08);
        setTimeout(() => {
          for (const n of nodes) { try { n.stop(); } catch { /* already stopped */ } }
          gain.disconnect();
        }, 400);
      },
    };
  }

  // ---------------------------------------------------------------- music

  startMusic() {
    this.wantMusic = true;
    if (this.musicTimer || !this.ctx) return;
    this.musicStep = 0;
    this.musicNext = this.ctx.currentTime + 0.1;
    const beat = 0.3;
    // A gentle looping tune: bass + plucked melody over C – Am – F – G.
    const chords = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 59, 62, 67]];
    const melody = [0, 2, 1, 3, 2, 1, 3, 2];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      while (this.musicNext < this.ctx.currentTime + 0.25) {
        const step = this.musicStep++;
        const chord = chords[Math.floor(step / 8) % chords.length];
        const at = Math.max(0, this.musicNext - this.ctx.currentTime);
        const idx = step % 8;
        if (idx === 0) this.tone({ f: NOTE(chord[0]), dur: beat * 3.6, vol: 0.05, type: 'triangle', at, out: this.musicGain });
        if (idx === 4) this.tone({ f: NOTE(chord[0] + 7), dur: beat * 2, vol: 0.035, type: 'triangle', at, out: this.musicGain });
        const n = chord[1 + (melody[idx] % 3)] + (melody[idx] === 3 ? 12 : 0) + 12;
        if (idx !== 5 || Math.floor(step / 8) % 2 === 0) {
          this.tone({ f: NOTE(n), dur: beat * 1.4, vol: 0.035, type: 'sine', at, out: this.musicGain });
          this.tone({ f: NOTE(n) * 2, dur: beat * 0.5, vol: 0.012, type: 'sine', at, out: this.musicGain });
        }
        this.musicNext += beat;
      }
    }, 80);
  }

  stopMusic() {
    this.wantMusic = false;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

export const sound = new Sound();
