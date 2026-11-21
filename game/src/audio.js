// audio.js — every sound is synthesized with WebAudio, no audio files: soft
// footsteps that tell you where a guard is, an alert sting, a pickup chime,
// and a slow ambient pad for the museum at night. Nothing starts until the
// player presses a key or clicks, so browsers allow it.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.padNodes = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startAmbientPad();
  }

  startAmbientPad() {
    // Two detuned triangle waves through a slow-breathing low-pass filter.
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.connect(this.master);
    const gain = ctx.createGain();
    gain.gain.value = 0.045;
    gain.connect(filter);
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = 110;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 164.8;
    const o3 = ctx.createOscillator();
    o3.type = 'sine';
    o3.frequency.value = 55;
    o1.connect(gain);
    o2.connect(gain);
    o3.connect(gain);
    o1.start();
    o2.start();
    o3.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.padNodes = { o1, o2, o3, lfo };
  }

  blip(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  footstep(running, pan = 0) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, 2205, 44100);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = running ? 700 : 420;
    const g = ctx.createGain();
    g.gain.value = running ? 0.22 : 0.12;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(filter);
    filter.connect(g);
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(panner);
      panner.connect(this.master);
    } else {
      g.connect(this.master);
    }
    src.start(t);
  }

  guardStep(pan) {
    // A guard's heavier step, panned by where the guard is: you hear them coming.
    this.footstep(true, pan);
  }

  alertSting() {
    this.blip(660, 0.16, 'square', 0.12);
    this.blip(880, 0.22, 'square', 0.12, 0.12);
  }

  spottedBlip() {
    this.blip(1174, 0.1, 'sine', 0.14);
  }

  pickupChime() {
    this.blip(523, 0.14, 'sine', 0.16);
    this.blip(784, 0.2, 'sine', 0.16, 0.09);
    this.blip(1046, 0.28, 'sine', 0.14, 0.18);
  }

  exitOpen() {
    this.blip(392, 0.3, 'triangle', 0.16);
    this.blip(523, 0.4, 'triangle', 0.16, 0.15);
  }

  caughtThud() {
    this.blip(98, 0.4, 'sawtooth', 0.2);
    this.blip(65, 0.5, 'sawtooth', 0.18, 0.1);
  }

  winFanfare() {
    [523, 659, 784, 1046].forEach((f, i) => this.blip(f, 0.35, 'triangle', 0.15, i * 0.13));
  }
}
