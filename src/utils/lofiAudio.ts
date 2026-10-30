// Web Audio API Radio & Lo-Fi Music Synthesizer for Refleksia City
// Provides relaxing procedural jazz/ambient beats tailored to the 5 times of day:
// Subuh (Dawn), Pagi (Morning), Siang (Afternoon), Sore (Sunset), Malam (Night)

export type TimePeriod = 'subuh' | 'pagi' | 'siang' | 'sore' | 'malam';

export interface RadioStationMeta {
  period: TimePeriod;
  stationName: string;
  tagline: string;
  frequency: string;
  bpm: number;
  filterFreq: number;
}

export const RADIO_STATIONS: Record<TimePeriod, RadioStationMeta> = {
  subuh: {
    period: 'subuh',
    stationName: 'Radio Kota • Nada Subuh',
    tagline: 'Fajar Menjelang & Ketenangan Pagi Buta',
    frequency: '92.4 FM',
    bpm: 56,
    filterFreq: 950,
  },
  pagi: {
    period: 'pagi',
    stationName: 'Radio Kota • Irama Pagi',
    tagline: 'Semangat Baru & Inspirasi Belajar DKV',
    frequency: '98.5 FM',
    bpm: 74,
    filterFreq: 1550,
  },
  siang: {
    period: 'siang',
    stationName: 'Radio Kota • Kafe Siang',
    tagline: 'Santai Kafe & Irama Diskusi Warga',
    frequency: '101.2 FM',
    bpm: 70,
    filterFreq: 1300,
  },
  sore: {
    period: 'sore',
    stationName: 'Radio Kota • Senja Sore',
    tagline: 'Kehangatan Senja & Kilau Keemasan',
    frequency: '104.8 FM',
    bpm: 64,
    filterFreq: 1150,
  },
  malam: {
    period: 'malam',
    stationName: 'Radio Kota • Malam Syahdu',
    tagline: 'Rehat Refleksi & Melodi Bintang',
    frequency: '88.9 FM',
    bpm: 62,
    filterFreq: 1000,
  },
};

export function getTimePeriodWita(date: Date = new Date()): TimePeriod {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar', // WITA UTC+8 (Gorontalo / Makassar)
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let hour = date.getHours();
    let minute = date.getMinutes();
    for (const p of parts) {
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    }
    const timeNum = hour + minute / 60;

    // 04:30 - 06:00: Subuh (Dawn / Fajar)
    if (timeNum >= 4.5 && timeNum < 6.0) return 'subuh';
    // 06:00 - 11:00: Pagi (Morning)
    if (timeNum >= 6.0 && timeNum < 11.0) return 'pagi';
    // 11:00 - 15:00: Siang (Afternoon / Midday)
    if (timeNum >= 11.0 && timeNum < 15.0) return 'siang';
    // 15:00 - 18:30: Sore (Sunset / Golden Hour)
    if (timeNum >= 15.0 && timeNum < 18.5) return 'sore';
    // 18:30 - 04:30: Malam (Night)
    return 'malam';
  } catch {
    const h = date.getHours();
    if (h >= 4 && h < 6) return 'subuh';
    if (h >= 6 && h < 11) return 'pagi';
    if (h >= 11 && h < 15) return 'siang';
    if (h >= 15 && h < 18) return 'sore';
    return 'malam';
  }
}

class LofiMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.45;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private timerId: number | null = null;
  private crackleSource: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;
  private currentPeriod: TimePeriod = 'malam';
  private listeners: Set<(playing: boolean, vol: number, period: TimePeriod, meta: RadioStationMeta) => void> = new Set();

  // Progressions tailored for each time of day (frequencies in Hz)
  private progressions: Record<TimePeriod, number[][][]> = {
    // Subuh: Peaceful, spacious, meditative
    subuh: [
      [
        [146.83, 220.00, 277.18, 369.99, 440.00], // Dmaj9
        [164.81, 246.94, 293.66, 369.99, 440.00], // F#m7
        [196.00, 246.94, 293.66, 369.99, 493.88], // Gmaj9
        [110.00, 164.81, 220.00, 277.18, 329.63], // A6/9
      ],
      [
        [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj9
        [146.83, 220.00, 261.63, 329.63, 392.00], // Dm9
        [164.81, 196.00, 246.94, 293.66, 329.63], // Em7
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj7
      ],
    ],
    // Pagi: Fresh, uplifting, optimistic
    pagi: [
      [
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
        [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [196.00, 246.94, 293.66, 349.23, 440.00], // G13
      ],
      [
        [174.61, 220.00, 261.63, 329.63],         // Fmaj7
        [196.00, 246.94, 293.66, 349.23],         // G7
        [164.81, 196.00, 246.94, 329.63],         // Em7
        [220.00, 261.63, 329.63, 392.00],         // Am7
      ],
    ],
    // Siang: Chill groove, coffeehouse vibe, study beat
    siang: [
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
    ],
    // Sore: Warm, nostalgic, golden-hour twilight
    sore: [
      [
        [103.83, 155.56, 207.65, 261.63, 311.13], // Abmaj9
        [87.31, 130.81, 174.61, 207.65, 261.63],  // Fm9
        [116.54, 138.59, 174.61, 207.65, 261.63], // Bbm9
        [155.56, 196.00, 233.08, 277.18, 349.23], // Eb9
      ],
      [
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj7
        [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
      ],
    ],
    // Malam: Deep midnight jazz, cozy muffled tones, sub-bass
    malam: [
      [
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [196.00, 246.94, 293.66, 349.23, 440.00], // G13
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
        [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
      ],
      [
        [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
        [164.81, 196.00, 246.94, 293.66, 329.63], // Em7
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
      ],
    ],
  };

  private currentProgIndex = 0;
  private currentStep = 0;

  constructor() {
    this.currentPeriod = getTimePeriodWita();
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        const meta = RADIO_STATIONS[this.currentPeriod];
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(meta.filterFreq, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(1.1, this.ctx.currentTime);

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
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const pink = (lastOut * 0.95) + (white * 0.05);
        lastOut = pink;
        const pop = Math.random() > 0.9996 ? (Math.random() - 0.5) * 0.35 : 0;
        data[i] = (pink * 0.018) + pop;
      }

      this.crackleSource = this.ctx.createBufferSource();
      this.crackleSource.buffer = buffer;
      this.crackleSource.loop = true;

      this.crackleGain = this.ctx.createGain();
      const crackleVol = this.currentPeriod === 'malam' ? 0.09 : 0.06;
      this.crackleGain.gain.setValueAtTime(crackleVol, this.ctx.currentTime);

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

  // Play an electric piano / vintage Rhodes note
  private playRhodesNote(freq: number, startTime: number, duration: number, vel: number = 0.12) {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = this.currentPeriod === 'subuh' ? 'sine' : 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime); // Tine chime overtone

    // Subtle tape flutter
    const flutterAmount = this.currentPeriod === 'sore' ? 2.2 : 1.2;
    const flutter = (Math.random() - 0.5) * flutterAmount;
    osc1.detune.setValueAtTime(flutter, startTime);
    osc2.detune.setValueAtTime(flutter * 1.6, startTime);

    // Warm envelope
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(vel, startTime + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(vel * 0.42, startTime + 0.65);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  // Soft sub-bass note
  private playBassNote(freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(freq / 2, startTime);

    const bassVel = this.currentPeriod === 'malam' ? 0.18 : 0.14;
    bassGain.gain.setValueAtTime(0.0001, startTime);
    bassGain.gain.linearRampToValueAtTime(bassVel, startTime + 0.06);
    bassGain.gain.exponentialRampToValueAtTime(bassVel * 0.45, startTime + 0.85);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);

    bassOsc.start(startTime);
    bassOsc.stop(startTime + duration);
  }

  // Schedule next beat
  private tick() {
    if (!this.isPlaying || !this.ctx) return;

    const list = this.progressions[this.currentPeriod] || this.progressions.malam;
    const prog = list[this.currentProgIndex % list.length];
    const chord = prog[this.currentStep % prog.length];
    const now = this.ctx.currentTime + 0.05;

    const meta = RADIO_STATIONS[this.currentPeriod];
    const stepDuration = (60 / meta.bpm) * 2.5; // step duration based on BPM
    const chordDuration = stepDuration * 0.92;

    // Play chord with rolling strum
    chord.forEach((freq, idx) => {
      const strumDelay = idx * 0.052;
      const vel = 0.075 - idx * 0.006;
      this.playRhodesNote(freq, now + strumDelay, chordDuration - strumDelay, Math.max(0.02, vel));
    });

    // Play bass root note
    if (chord.length > 0) {
      this.playBassNote(chord[0], now, chordDuration);
    }

    // Secondary comp hit midway
    if (this.currentPeriod !== 'subuh' && Math.random() > 0.42) {
      const hitDelay = stepDuration * 0.52;
      chord.slice(1, 4).forEach((freq, idx) => {
        this.playRhodesNote(freq, now + hitDelay + idx * 0.03, stepDuration * 0.35, 0.032);
      });
    }

    this.currentStep++;
    if (this.currentStep >= prog.length * 2) {
      this.currentStep = 0;
      this.currentProgIndex = (this.currentProgIndex + 1) % list.length;
    }

    this.timerId = window.setTimeout(() => this.tick(), Math.round(stepDuration * 1000));
  }

  public setTimePeriod(period: TimePeriod) {
    if (this.currentPeriod === period) return;
    this.currentPeriod = period;

    if (this.filterNode && this.ctx) {
      const meta = RADIO_STATIONS[period];
      this.filterNode.frequency.setTargetAtTime(meta.filterFreq, this.ctx.currentTime, 0.5);
    }

    this.currentProgIndex = 0;
    this.currentStep = 0;
    this.notify();
  }

  public getTimePeriod(): TimePeriod {
    return this.currentPeriod;
  }

  public getStationInfo(): RadioStationMeta {
    return RADIO_STATIONS[this.currentPeriod];
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

  public subscribe(cb: (playing: boolean, vol: number, period: TimePeriod, meta: RadioStationMeta) => void): () => void {
    this.listeners.add(cb);
    cb(this.isPlaying, this.volume, this.currentPeriod, RADIO_STATIONS[this.currentPeriod]);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const meta = RADIO_STATIONS[this.currentPeriod];
    this.listeners.forEach((cb) => cb(this.isPlaying, this.volume, this.currentPeriod, meta));
  }
}

export const lofiMusic = new LofiMusicEngine();
