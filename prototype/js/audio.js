/* audio.js — SFX tao bang WebAudio, khong dung asset.
   Muc dich: chung minh COIN CHIME LADDER (docs/13 -- "vu khi gay nghien so 1"):
   moi dong vang lien tiep trong 1.5s tang NUA CUNG, cap 2 quang tam, reset sau 1.5s. */

const SEMI = Math.pow(2, 1 / 12);

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.coinStep = 0;
    this.coinLast = 0;
    this.enabled = true;
  }

  /** Phai goi trong 1 gesture cua nguoi dung (autoplay policy). */
  unlock() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  _t() { return this.ctx.currentTime; }

  _env(node, t, a, d, peak) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    node.connect(g);
    g.connect(this.master);
    return g;
  }

  _noise(dur) {
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  /* ---------- COIN CHIME LADDER ---------- */
  coin() {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    if (t - this.coinLast > 1.5) this.coinStep = 0;
    this.coinLast = t;
    const step = Math.min(this.coinStep, 24);          // cap 2 quang tam
    this.coinStep++;
    const base = 784;                                   // G5
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = base * Math.pow(SEMI, step);
    this._env(o, t, 0.004, 0.11, 0.16);
    o.start(t); o.stop(t + 0.14);
  }

  shot(heavy = false) {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const src = this._noise(heavy ? 0.18 : 0.09);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(heavy ? 1400 : 2600, t);
    f.frequency.exponentialRampToValueAtTime(180, t + (heavy ? 0.16 : 0.08));
    src.connect(f);
    this._env(f, t, 0.002, heavy ? 0.17 : 0.08, heavy ? 0.5 : 0.3);
    src.start(t);
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(heavy ? 90 : 150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    this._env(o, t, 0.002, 0.09, heavy ? 0.28 : 0.14);
    o.start(t); o.stop(t + 0.12);
  }

  slash(heavy = false) {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const src = this._noise(heavy ? 0.26 : 0.16);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2.2;
    f.frequency.setValueAtTime(600, t);
    f.frequency.exponentialRampToValueAtTime(heavy ? 3200 : 4200, t + 0.1);
    src.connect(f);
    this._env(f, t, 0.005, heavy ? 0.24 : 0.14, heavy ? 0.42 : 0.26);
    src.start(t);
  }

  /** Chem Hoan Hao — tieng "shiiing" cao vut, duck mix o game.js */
  perfect() {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(3400, t + 0.16);
    this._env(o, t, 0.006, 0.3, 0.3);
    o.start(t); o.stop(t + 0.34);
  }

  hitFlesh() {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const src = this._noise(0.06);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 700;
    src.connect(f);
    this._env(f, t, 0.002, 0.05, 0.22);
    src.start(t);
  }

  hurt() {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.22);
    this._env(o, t, 0.003, 0.22, 0.3);
    o.start(t); o.stop(t + 0.26);
  }

  reloadClick(ok) {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const o = this.ctx.createOscillator();
    o.type = ok ? 'square' : 'sawtooth';
    o.frequency.setValueAtTime(ok ? 900 : 200, t);
    if (ok) o.frequency.exponentialRampToValueAtTime(1500, t + 0.05);
    this._env(o, t, 0.002, ok ? 0.07 : 0.16, 0.2);
    o.start(t); o.stop(t + 0.2);
  }

  /** Bao truoc wave to: tieng lao xao ti le voi so quai (docs/15). */
  crowd(count) {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const src = this._noise(0.9);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.8;
    f.frequency.value = 280;
    src.connect(f);
    this._env(f, t, 0.25, 0.7, Math.min(0.34, 0.05 + count / 400));
    src.start(t);
  }

  mist() {
    if (!this.ctx || !this.enabled) return;
    const t = this._t();
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, t);
    o.frequency.linearRampToValueAtTime(48, t + 1.1);
    this._env(o, t, 0.3, 1.0, 0.22);
    o.start(t); o.stop(t + 1.4);
  }

  duck(amount, sec) {
    if (!this.ctx || !this.master) return;
    const t = this._t();
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0.5 * (1 - amount), t);
    this.master.gain.linearRampToValueAtTime(0.5, t + sec);
  }
}
