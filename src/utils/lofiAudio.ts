// Web Audio API Lo-Fi Music Synthesizer for Refleksia City
// Provides relaxing, procedural jazz/study beats with warm rhodes keys, soft bass, and vintage tape crackle

class LofiMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.45;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private timerId: number | null = null;
  private crackleSource: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;
  private listeners: Set<(playing: boolean, vol: number) => void> = new Set();

  // Jazz chord progressions in Hz (Root, 3rd, 5th, 7th, 9th)
  // Progression 1: Fmaj9 -> Em7 -> Dm9 -> Cmaj7
  // Progression 2: Dm9 -> G13 -> Cmaj9 -> Am9
  private chordProgressions = [
    [
      [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
      [164.81, 196.00, 246.94, 293.66, 329.63], // Em7
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj7
    ],
    [
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
      [196.00, 246.94, 293.66, 349.23, 440.00], // G13
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
      [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
    ],
    [
      [174.61, 220.00, 261.63, 329.63],         // Fmaj7
      [196.00, 246.94, 293.66, 349.23],         // G7
      [164.81, 196.00, 246.94, 329.63],         // Em7
      [220.00, 261.63, 329.63, 392.00],         // Am7
    ]
  ];

  private currentProgIndex = 0;
  private currentStep = 0;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        // Low-pass filter for signature muffled, cozy Lo-Fi warmth (~1200Hz)
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(1250, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

        this.masterGain.connect(this.filterNode);
        this.filterNode.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private startTapeCrackle() {
    if (!this.ctx || !this.masterGain) return;
    try {
      // Generate 4 seconds of subtle vinyl static & random pops
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink noise approximation
        const white = Math.random() * 2 - 1;
        const pink = (lastOut * 0.95) + (white * 0.05);
        lastOut = pink;

        // Occasional vinyl pops/clicks
        const pop = Math.random() > 0.9996 ? (Math.random() - 0.5) * 0.4 : 0;
        data[i] = (pink * 0.02) + pop;
      }

      this.crackleSource = this.ctx.createBufferSource();
      this.crackleSource.buffer = buffer;
      this.crackleSource.loop = true;

      this.crackleGain = this.ctx.createGain();
      this.crackleGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.crackleSource.connect(this.crackleGain);
      this.crackleGain.connect(this.masterGain);
      this.crackleSource.start();
    } catch {
      // Ignore audio error
    }
  }

  private stopTapeCrackle() {
    if (this.crackleSource) {
      try {
        this.crackleSource.stop();
        this.crackleSource.disconnect();
      } catch {
        // ignore
      }
      this.crackleSource = null;
    }
  }

  // Play an electric piano note with subtle vibrato & soft attack
  private playRhodesNote(freq: number, startTime: number, duration: number, vel: number = 0.12) {
    if (!this.ctx || !this.masterGain) return;

    // Carrier oscillator: Triangle + soft Sine
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime); // 1st overtone for tines bell sound

    // Gentle pitch detuning / tape flutter
    const flutter = (Math.random() - 0.5) * 1.5;
    osc1.detune.setValueAtTime(flutter, startTime);
    osc2.detune.setValueAtTime(flutter * 1.5, startTime);

    // Warm envelope
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(vel, startTime + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(vel * 0.45, startTime + 0.6);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  // Play a soft sub-bass note
  private playBassNote(freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sine';
    // Play an octave lower
    bassOsc.frequency.setValueAtTime(freq / 2, startTime);

    bassGain.gain.setValueAtTime(0.0001, startTime);
    bassGain.gain.linearRampToValueAtTime(0.16, startTime + 0.06);
    bassGain.gain.exponentialRampToValueAtTime(0.07, startTime + 0.8);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);

    bassOsc.start(startTime);
    bassOsc.stop(startTime + duration);
  }

  // Advance beat step every 2.4s (68 BPM cadence)
  private tick() {
    if (!this.isPlaying || !this.ctx) return;

    const prog = this.chordProgressions[this.currentProgIndex % this.chordProgressions.length];
    const chord = prog[this.currentStep % prog.length];
    const now = this.ctx.currentTime + 0.05;
    const chordDuration = 2.2;

    // Play chord with delicate rolling arpeggio (strum effect)
    chord.forEach((freq, idx) => {
      const strumDelay = idx * 0.055;
      const vel = 0.07 - idx * 0.006;
      this.playRhodesNote(freq, now + strumDelay, chordDuration - strumDelay, Math.max(0.02, vel));
    });

    // Play bass root note
    if (chord.length > 0) {
      this.playBassNote(chord[0], now, chordDuration);
    }

    // Occasional subtle second comp hit midway through chord
    if (Math.random() > 0.4) {
      const hitDelay = 1.2;
      chord.slice(1, 4).forEach((freq, idx) => {
        this.playRhodesNote(freq, now + hitDelay + idx * 0.03, 0.7, 0.035);
      });
    }

    this.currentStep++;
    if (this.currentStep >= prog.length * 2) {
      this.currentStep = 0;
      this.currentProgIndex = (this.currentProgIndex + 1) % this.chordProgressions.length;
    }

    this.timerId = window.setTimeout(() => this.tick(), 2400);
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public play() {
    this.initContext();
    if (!this.ctx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.startTapeCrackle();
    this.tick();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.stopTapeCrackle();
    this.notify();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public subscribe(cb: (playing: boolean, vol: number) => void): () => void {
    this.listeners.add(cb);
    cb(this.isPlaying, this.volume);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isPlaying, this.volume));
  }
}

export const lofiMusic = new LofiMusicEngine();
