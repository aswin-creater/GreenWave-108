/**
 * Multi-Mode Audio Synthesizer for AmbuWave Connect
 * Procedural Web Audio API sound generator providing unique audio profiles for:
 * - CRITICAL mode: Rapid urgent Yelp / Wail 108 emergency siren & horn blast
 * - ON_CALL mode: Moderate Hi-Lo cautionary emergency transit wail
 * - IDLE mode: Low engine hum & intermittent radio dispatch squelch
 * - BASELINE mode: City traffic horn beep & ambient street rumble
 * - CONSTRUCTION mode: Reverse alarm / hazard caution beeps
 * - Street View & Signal chime alerts
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private currentMode: 'CRITICAL' | 'ON_CALL' | 'IDLE' | 'NONE' = 'NONE';
  private engineHumGain: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public stopAllSounds() {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeGains.forEach((g) => {
      try {
        g.disconnect();
      } catch {}
    });
    this.activeOscillators = [];
    this.activeGains = [];
    this.currentMode = 'NONE';
  }

  /**
   * Play specific audio based on ambulance urgency mode
   */
  public playModeAudio(mode: 'CRITICAL' | 'ON_CALL' | 'IDLE', volume: number = 0.12) {
    const ctx = this.initContext();
    if (!ctx) return;

    this.stopAllSounds();
    this.currentMode = mode;

    if (mode === 'CRITICAL') {
      // Rapid urgent 108 Yelp/Wail dual-tone siren
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.2);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      lfo.type = 'triangle';
      lfo.frequency.setValueAtTime(1.2, ctx.currentTime); // Fast 1.2 Hz yelp sweep
      lfoGain.gain.setValueAtTime(260, ctx.currentTime);

      osc1.frequency.setValueAtTime(740, ctx.currentTime);
      osc2.frequency.setValueAtTime(745, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      masterGain.connect(filter);
      filter.connect(ctx.destination);

      lfo.start();
      osc1.start();
      osc2.start();

      this.activeOscillators.push(osc1, osc2, lfo);
      this.activeGains.push(masterGain, lfoGain);
    } else if (mode === 'ON_CALL') {
      // Slower steady Hi-Lo European/Indian cautionary siren
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + 0.3);

      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sine';
      lfo.type = 'square'; // Hi-Lo alternating square switch
      lfo.frequency.setValueAtTime(0.9, ctx.currentTime); // ~1 sec interval
      lfoGain.gain.setValueAtTime(120, ctx.currentTime);

      osc.frequency.setValueAtTime(520, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(masterGain);
      masterGain.connect(ctx.destination);

      lfo.start();
      osc.start();

      this.activeOscillators.push(osc, lfo);
      this.activeGains.push(masterGain, lfoGain);
    } else if (mode === 'IDLE') {
      // Gentle diesel engine idle hum and occasional radio squelch
      const engineGain = ctx.createGain();
      engineGain.gain.setValueAtTime(0.04, ctx.currentTime);

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75, ctx.currentTime); // 75 Hz low idle hum

      osc.connect(engineGain);
      engineGain.connect(ctx.destination);
      osc.start();

      this.activeOscillators.push(osc);
      this.activeGains.push(engineGain);
    }
  }

  /**
   * Emergency vehicle air-horn burst to clear intersection
   */
  public playHornBurst() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(370, ctx.currentTime); // dual chord
      osc2.frequency.setValueAtTime(466, ctx.currentTime);

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch {}
  }

  /**
   * Construction zone reverse hazard beeps
   */
  public playConstructionWarning() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.22, 0.44].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1100, now + delay);

        gain.gain.setValueAtTime(0.06, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.13);
      });
    } catch {}
  }

  /**
   * Approach Radar Ping (Signal ahead approaching)
   */
  public playSignalApproachChime() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(988, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  /**
   * Priority Accepted Fanfare ("Green Wave Locked")
   */
  public playGreenWaveLockedChime() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {}
  }

  /**
   * Red Light Caution Tone
   */
  public playRedLightCautionAlert() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.setValueAtTime(210, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  public getCurrentMode() {
    return this.currentMode;
  }
}

export const audioService = new AudioSynthesizer();
