export type RagaType = 'BHAIRAV' | 'DARBARI' | 'MARWA';

export interface SwaraNote {
  name: string;
  ratio: number;
}

export const SWARA_RATIOS: Record<string, number> = {
  S: 1.0,        // Shadja
  r: 16 / 15,    // Komal Rishabh (1.0667)
  R: 9 / 8,      // Shuddha Rishabh (1.125)
  g: 6 / 5,      // Komal Gandhar (1.2)
  G: 5 / 4,      // Shuddha Gandhar (1.25)
  m: 4 / 3,      // Shuddha Madhyam (1.3333)
  M: 45 / 32,    // Tivra Madhyam (1.40625)
  P: 3 / 2,      // Pancham (1.5)
  d: 8 / 5,      // Komal Dhaivat (1.6)
  D: 5 / 3,      // Shuddha Dhaivat (1.6667)
  n: 9 / 5,      // Komal Nishad (1.8)
  N: 15 / 8,     // Shuddha Nishad (1.875)
  "S'": 2.0,     // Tar Shadja (2.0)
};

export const RAGA_SCALES: Record<RagaType, string[]> = {
  BHAIRAV: ['S', 'r', 'G', 'm', 'P', 'd', 'N', "S'"],
  DARBARI: ['S', 'R', 'g', 'm', 'P', 'd', 'n', "S'"],
  MARWA: ['S', 'r', 'G', 'M', 'D', 'N', "S'"], // Note: Marwa omits Pancham (P)
};

export class RagaMusicGenerator {
  private ctx: AudioContext | null = null;
  private outputNode: AudioNode | null = null;

  public activeRaga: RagaType = 'BHAIRAV';
  public rootFreq = 108.0; // Fundamental Sa in Hz
  public tension = 0.0; // [0.0 = meditative, 1.0 = climactic battle]

  private isRunning = false;
  private volume = 0.8;

  // Drone Nodes
  private droneOscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;

  // Timers for procedural events
  private melodyTimer = 0;
  private rhythmTimer = 0;
  private beatStep = 0; // 0 to 15 (Tintal 16-beat cycle)
  private currentMelodyIndex = 0;

  constructor(ctx: AudioContext | null, outputNode?: AudioNode) {
    this.ctx = ctx;
    this.outputNode = outputNode ?? null;
  }

  public setOutput(outputNode: AudioNode): void {
    this.outputNode = outputNode;
  }

  public setRaga(raga: RagaType): void {
    this.activeRaga = raga;
    this.currentMelodyIndex = 0;
  }

  public setTension(tension: number): void {
    this.tension = Math.max(0.0, Math.min(1.0, tension));
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.melodyTimer = 0.2;
    this.rhythmTimer = 0.5;
    this.beatStep = 0;
    this.startTamburaDrone();
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.stopTamburaDrone();
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public update(dt: number): void {
    if (!this.isRunning || !this.ctx || !this.outputNode) return;

    // Melody pacing scales inversely with tension:
    // Tension 0.0 -> interval 2.5s; Tension 1.0 -> interval 0.35s
    this.melodyTimer -= dt;
    const melodyInterval = 2.5 - this.tension * 2.15;
    if (this.melodyTimer <= 0) {
      this.triggerMelodicNote();
      this.melodyTimer = melodyInterval;
    }

    // Rhythm (Tabla) triggers when tension >= 0.20
    if (this.tension >= 0.2) {
      this.rhythmTimer -= dt;
      // Tempo scales with tension: 120 bpm (0.5s beat) at 0.20 -> 240 bpm (0.25s beat) at 1.0
      const beatInterval = 0.55 - this.tension * 0.3;
      if (this.rhythmTimer <= 0) {
        this.triggerTablaBeat(this.beatStep);
        this.beatStep = (this.beatStep + 1) % 16;
        this.rhythmTimer = beatInterval;
      }
    }
  }

  private startTamburaDrone(): void {
    if (!this.ctx || !this.outputNode) return;
    this.stopTamburaDrone();

    try {
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
      this.droneGain.connect(this.outputNode);

      // 4 Tanpura strings: Pa (or Ma in Marwa), Sa, Sa, Low Sa
      const fifthSwara = this.activeRaga === 'MARWA' ? 'M' : 'P';
      const fifthRatio = SWARA_RATIOS[fifthSwara] ?? 1.5;
      const dronePitches = [
        this.rootFreq * fifthRatio,      // Pa / Ma
        this.rootFreq * 2.0,             // Octave Sa
        this.rootFreq * 2.0 * 1.002,     // Shimmering micro-detuned Sa
        this.rootFreq,                   // Mandra Sa
      ];

      for (const pitch of dronePitches) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

        const stringGain = this.ctx.createGain();
        stringGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

        osc.connect(stringGain);
        stringGain.connect(this.droneGain);

        osc.start();
        this.droneOscs.push(osc);
      }
    } catch {
      // Graceful fallback for mock environments
    }
  }

  private stopTamburaDrone(): void {
    for (const osc of this.droneOscs) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Safe disconnect
      }
    }
    this.droneOscs = [];
    if (this.droneGain) {
      try {
        this.droneGain.disconnect();
      } catch {
        // Safe disconnect
      }
      this.droneGain = null;
    }
  }

  public triggerMelodicNote(): void {
    if (!this.ctx || !this.outputNode) return;

    const scale = RAGA_SCALES[this.activeRaga];
    if (!scale || scale.length === 0) return;

    // Advance through scale or perform melodic turn
    const stepChoice = Math.random();
    if (stepChoice < 0.5) {
      this.currentMelodyIndex = (this.currentMelodyIndex + 1) % scale.length;
    } else if (stepChoice < 0.8) {
      this.currentMelodyIndex = Math.max(0, this.currentMelodyIndex - 1);
    } else {
      this.currentMelodyIndex = Math.floor(Math.random() * scale.length);
    }

    const swara = scale[this.currentMelodyIndex];
    const ratio = SWARA_RATIOS[swara] ?? 1.0;
    const targetFreq = this.rootFreq * 2.0 * ratio; // High melodic register (216Hz - 432Hz)

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = this.tension > 0.6 ? 'sawtooth' : 'triangle';
      
      // Sitar Meend (glide from previous or base note)
      const glideStart = targetFreq * (0.95 + Math.random() * 0.1);
      osc.frequency.setValueAtTime(glideStart, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.08);

      const noteDuration = 0.4 + (1 - this.tension) * 0.8;
      const peakGain = (0.12 + this.tension * 0.1) * this.volume;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);

      osc.connect(gain);
      gain.connect(this.outputNode);

      osc.start(now);
      osc.stop(now + noteDuration + 0.05);
    } catch {
      // Safe fallback
    }
  }

  public triggerTablaBeat(step: number): void {
    if (!this.ctx || !this.outputNode) return;

    // Tintal 16-beat cycle:
    // Beats 0, 4, 12 are emphasized (Tali)
    // Beat 8 is empty/soft (Khali)
    const isSam = step === 0;
    const isTali = step === 4 || step === 12;
    const isKhali = step === 8;

    const now = this.ctx.currentTime;

    try {
      // Bayan (Bass drum pitch bend)
      if (isSam || isTali || (this.tension > 0.5 && step % 2 === 0)) {
        const bayanOsc = this.ctx.createOscillator();
        const bayanGain = this.ctx.createGain();

        bayanOsc.type = 'sine';
        const startPitch = isSam ? 130 : 105;
        bayanOsc.frequency.setValueAtTime(startPitch, now);
        bayanOsc.frequency.exponentialRampToValueAtTime(55, now + 0.18);

        const bayanVol = (isSam ? 0.35 : 0.22) * this.volume;
        bayanGain.gain.setValueAtTime(bayanVol, now);
        bayanGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        bayanOsc.connect(bayanGain);
        bayanGain.connect(this.outputNode);

        bayanOsc.start(now);
        bayanOsc.stop(now + 0.22);
      }

      // Dayan (Treble rim stroke)
      if (!isKhali || this.tension > 0.7) {
        const dayanOsc = this.ctx.createOscillator();
        const dayanGain = this.ctx.createGain();

        dayanOsc.type = 'triangle';
        const dayanPitch = this.rootFreq * 2.5; // Resonant tuned harmonic
        dayanOsc.frequency.setValueAtTime(dayanPitch, now);

        const dayanVol = (0.15 + this.tension * 0.1) * this.volume;
        dayanGain.gain.setValueAtTime(dayanVol, now);
        dayanGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        dayanOsc.connect(dayanGain);
        dayanGain.connect(this.outputNode);

        dayanOsc.start(now);
        dayanOsc.stop(now + 0.12);
      }
    } catch {
      // Safe fallback
    }
  }
}
