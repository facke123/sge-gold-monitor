/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBell() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two bells ring slightly spaced
      this.ringBell(now);
      this.ringBell(now + 0.35);
    } catch (e) {
      console.error('Failed to play bell sound:', e);
    }
  }

  private ringBell(startTime: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, startTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1200, startTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.15);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 1.3);
  }

  playSiren() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      
      // Sweep frequency up and down for a siren effect
      osc.frequency.linearRampToValueAtTime(880, now + 0.3);
      osc.frequency.linearRampToValueAtTime(440, now + 0.6);
      osc.frequency.linearRampToValueAtTime(880, now + 0.9);
      osc.frequency.linearRampToValueAtTime(440, now + 1.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 1.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.4);
    } catch (e) {
      console.error('Failed to play siren sound:', e);
    }
  }

  playElectronic() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 0.12;

      // 4 quick double beeps
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.25;
        this.playBeep(t, 1200, duration);
        this.playBeep(t + 0.08, 1500, duration);
      }
    } catch (e) {
      console.error('Failed to play electronic alert:', e);
    }
  }

  private playBeep(time: number, freq: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}

export const audioSynth = new AudioSynth();
