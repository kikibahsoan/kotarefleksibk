// Web Audio API Radio & Multi-Station Music Synthesizer for Refleksia City
// Saluran Radio:
// 1. RRI Pro 1 Gorontalo (101.8 FM) - Live Stream Siaran Radio Gorontalo (Otomatis Pertama)
// 2. Malam Tenang dari Antent (99.9 FM) - Ambient Loop (Antent - Hope to See You Again / Link Drive)
// 3. Musik Seperti Ghibli (89.5 FM) - Akustik Piano & String Nostalgia Khas Joe Hisaishi / Studio Ghibli
// 4. Lo-Fi Kota Refleksia (104.2 FM) - Musik Santai 5 Waktu WITA

export type TimePeriod = 'subuh' | 'pagi' | 'siang' | 'sore' | 'malam';

export type RadioChannel = 'rri_gorontalo' | 'malam_tenang' | 'ghibli' | 'lofi_wita';

export interface RadioStationMeta {
  channel: RadioChannel;
  stationName: string;
  tagline: string;
  frequency: string;
  icon: string;
  description: string;
  period?: TimePeriod;
  streamUrl?: string;
  externalUrl?: string;
  bpm?: number;
}

export const DEFAULT_MALAM_TENANG_AUDIO_URL = '/assets/aistudio/hope_to_see_you_again_5c4357d9.mp3';
const CUSTOM_DRIVE_URL_STORAGE_KEY = 'kota_refleksi_radio_999_drive_url';

/**
 * Converts a standard Google Drive sharing link (e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing)
 * into a direct streamable URL, or returns the original URL if it's already a direct audio URL.
 */
export function resolveDriveAudioUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return DEFAULT_MALAM_TENANG_AUDIO_URL;

  // Match /file/d/<ID> or id=<ID>
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://docs.google.com/uc?export=download&id=${fileMatch[1]}`;
  }
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1] && trimmed.includes('drive.google.com')) {
    return `https://docs.google.com/uc?export=download&id=${idParamMatch[1]}`;
  }
  return trimmed;
}

export const RADIO_CHANNELS: Record<RadioChannel, RadioStationMeta> = {
  rri_gorontalo: {
    channel: 'rri_gorontalo',
    stationName: 'RRI Pro 1 Gorontalo',
    tagline: 'Kanal Informasi, Inspirasi & Budaya Gorontalo',
    frequency: '101.8 FM',
    icon: '📻',
    description: 'Siaran langsung radio publik RRI Pro 1 Gorontalo secara live',
    streamUrl: 'https://stream-node1.rri.co.id/streaming/15/9115/rrigorontalopro1.mp3',
    externalUrl: 'https://onlineradiobox.com/id/rripro1gorontalo/?cs=id.rripro1gorontalo&played=1',
  },
  malam_tenang: {
    channel: 'malam_tenang',
    stationName: 'Malam Tenang dari Antent',
    tagline: 'Ambient Loop • Antent (99.9 FM)',
    frequency: '99.9 FM',
    icon: '🌙',
    description: 'Alunan musik Malam Tenang dari Antent yang diputar berulang (loop) menemani suasana refleksi kota',
    streamUrl: DEFAULT_MALAM_TENANG_AUDIO_URL,
  },
  ghibli: {
    channel: 'ghibli',
    stationName: 'Studio Ghibli Melodies',
    tagline: 'Melodi Piano & Akustik Hangat Joe Hisaishi',
    frequency: '89.5 FM',
    icon: '🍃',
    description: 'Aransemen musik damai, emosional & nostalgia khas film-film Studio Ghibli',
    bpm: 68,
  },
  lofi_wita: {
    channel: 'lofi_wita',
    stationName: 'Radio Lo-Fi Refleksia',
    tagline: 'Irama Santai Mengikuti 5 Waktu WITA',
    frequency: '104.2 FM',
    icon: '☕',
    description: 'Beats lo-fi santai menemani waktu belajar siswa di kota',
    bpm: 70,
  },
};

export const RADIO_STATIONS: Record<TimePeriod, RadioStationMeta> = {
  subuh: {
    channel: 'lofi_wita',
    period: 'subuh',
    stationName: 'Radio Kota • Nada Subuh',
    tagline: 'Fajar Menjelang & Ketenangan Pagi Buta',
    frequency: '92.4 FM',
    icon: '☕',
    description: 'Nada lo-fi fajar yang hening dan menenangkan',
    bpm: 56,
  },
  pagi: {
    channel: 'lofi_wita',
    period: 'pagi',
    stationName: 'Radio Kota • Irama Pagi',
    tagline: 'Semangat Baru & Inspirasi Belajar DKV',
    frequency: '98.5 FM',
    icon: '☕',
    description: 'Irama pagi penuh semangat belajar',
    bpm: 74,
  },
  siang: {
    channel: 'lofi_wita',
    period: 'siang',
    stationName: 'Radio Kota • Kafe Siang',
    tagline: 'Santai Kafe & Irama Diskusi Warga',
    frequency: '101.2 FM',
    icon: '☕',
    description: 'Groove santai kafe siang hari',
    bpm: 70,
  },
  sore: {
    channel: 'lofi_wita',
    period: 'sore',
    stationName: 'Radio Kota • Senja Sore',
    tagline: 'Kehangatan Senja & Kilau Keemasan',
    frequency: '104.8 FM',
    icon: '☕',
    description: 'Melodi senja sore yang hangat',
    bpm: 64,
  },
  malam: {
    channel: 'lofi_wita',
    period: 'malam',
    stationName: 'Radio Kota • Malam Syahdu',
    tagline: 'Rehat Refleksi & Melodi Bintang',
    frequency: '88.9 FM',
    icon: '☕',
    description: 'Alunan lembut menemani malam refleksi',
    bpm: 62,
  },
};

export function getTimePeriodWita(date: Date = new Date()): TimePeriod {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
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

    if (timeNum >= 4.5 && timeNum < 6.0) return 'subuh';
    if (timeNum >= 6.0 && timeNum < 11.0) return 'pagi';
    if (timeNum >= 11.0 && timeNum < 15.0) return 'siang';
    if (timeNum >= 15.0 && timeNum < 18.5) return 'sore';
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

class RadioAndMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private timerId: number | null = null;

  // Active channel: Defaults to RRI Pro 1 Gorontalo as requested
  private activeChannel: RadioChannel = 'rri_gorontalo';
  private currentPeriod: TimePeriod = 'siang';

  // Live Radio HTML5 Audio Element for RRI Stream
  private rriAudio: HTMLAudioElement | null = null;
  private isRriConnecting: boolean = false;

  // HTML5 Audio Element for 99.9 FM Malam Tenang dari Antent (Looped)
  private malamTenangAudio: HTMLAudioElement | null = null;
  private customDriveUrl: string = '';
  private isUsingFallbackAudio: boolean = false;

  // Tape crackle for Lo-Fi
  private crackleSource: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;

  private listeners: Set<(playing: boolean, vol: number, channel: RadioChannel, meta: RadioStationMeta) => void> = new Set();

  // -------------------------------------------------------------
  // STUDIO GHIBLI / JOE HISAISHI CHORD PROGRESSIONS & MELODIES
  // -------------------------------------------------------------
  private ghibliProgressions: number[][][] = [
    // Theme 1: Spirited Away / One Summer's Day (Fmaj7 - G7 - Em7 - Am7 - Dm7 - G - Cmaj7)
    [
      [174.61, 220.00, 261.63, 329.63, 440.00], // Fmaj9
      [196.00, 246.94, 293.66, 349.23, 392.00], // G9
      [164.81, 196.00, 246.94, 329.63, 392.00], // Em7
      [110.00, 164.81, 220.00, 261.63, 329.63], // Am7
      [146.83, 174.61, 220.00, 261.63, 349.23], // Dm9
      [196.00, 261.63, 293.66, 392.00],         // Gsus4 -> G
      [130.81, 164.81, 196.00, 246.94, 329.63], // Cmaj9
      [130.81, 164.81, 196.00, 233.08, 329.63], // C7
    ],
    // Theme 2: Howl's Moving Castle / Merry-Go-Round Waltz (Gm - D7 - Gm - Cm - F - Bb - Eb - D7)
    [
      [196.00, 233.08, 293.66, 392.00],         // Gm
      [146.83, 220.00, 277.18, 349.23],         // D7/F#
      [196.00, 233.08, 293.66, 466.16],         // Gm
      [130.81, 196.00, 233.08, 311.13],         // Cm
      [174.61, 220.00, 261.63, 349.23],         // F7
      [116.54, 174.61, 233.08, 293.66, 349.23], // Bbmaj7
      [155.56, 196.00, 233.08, 311.13, 392.00], // Ebmaj7
      [146.83, 220.00, 293.66, 369.99],         // D7
    ],
    // Theme 3: My Neighbor Totoro "Path of the Wind" (C#m - F#m - B7 - Emaj7 - A - G#7)
    [
      [138.59, 164.81, 207.65, 277.18, 329.63], // C#m7
      [185.00, 220.00, 277.18, 369.99],         // F#m7
      [123.47, 185.00, 246.94, 293.66, 369.99], // B7
      [164.81, 207.65, 246.94, 329.63, 392.00], // Emaj7
      [110.00, 164.81, 220.00, 277.18, 329.63], // Amaj7
      [207.65, 246.94, 311.13, 369.99],         // G#7
    ],
  ];

  // Ghibli melodic notes (Pentatonic and lyrical motifs)
  private ghibliMelodyNotes = [
    261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00
  ];

  // -------------------------------------------------------------
  // LO-FI WITA CHORD PROGRESSIONS
  // -------------------------------------------------------------
  private lofiProgressions: Record<TimePeriod, number[][][]> = {
    subuh: [
      [
        [146.83, 220.00, 277.18, 369.99, 440.00], // Dmaj9
        [164.81, 246.94, 293.66, 369.99, 440.00], // F#m7
        [196.00, 246.94, 293.66, 369.99, 493.88], // Gmaj9
        [110.00, 164.81, 220.00, 277.18, 329.63], // A6/9
      ],
    ],
    pagi: [
      [
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
        [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [196.00, 246.94, 293.66, 349.23, 440.00], // G13
      ],
    ],
    siang: [
      [
        [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
        [164.81, 196.00, 246.94, 293.66, 329.63], // Em7
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj7
      ],
    ],
    sore: [
      [
        [103.83, 155.56, 207.65, 261.63, 311.13], // Abmaj9
        [87.31, 130.81, 174.61, 207.65, 261.63],  // Fm9
        [116.54, 138.59, 174.61, 207.65, 261.63], // Bbm9
        [155.56, 196.00, 233.08, 277.18, 349.23], // Eb9
      ],
    ],
    malam: [
      [
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [196.00, 246.94, 293.66, 349.23, 440.00], // G13
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
        [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
      ],
    ],
  };

  private currentProgIndex = 0;
  private currentStep = 0;
  private ghibliMelodyIndex = 0;

  constructor() {
    this.currentPeriod = getTimePeriodWita();
    if (typeof window !== 'undefined') {
      try {
        this.customDriveUrl = localStorage.getItem(CUSTOM_DRIVE_URL_STORAGE_KEY) || '';
      } catch {}
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(1400, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(1.0, this.ctx.currentTime);

        this.masterGain.connect(this.filterNode);
        this.filterNode.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // -------------------------------------------------------------
  // RRI PRO 1 GORONTALO AUDIO STREAM
  // -------------------------------------------------------------
  private startRriStream() {
    if (typeof window === 'undefined') return;

    if (!this.rriAudio) {
      this.rriAudio = new Audio();
      this.rriAudio.preload = 'none';
      this.rriAudio.src = RADIO_CHANNELS.rri_gorontalo.streamUrl!;
      this.rriAudio.volume = this.volume;

      this.rriAudio.addEventListener('playing', () => {
        this.isRriConnecting = false;
        this.notify();
      });

      this.rriAudio.addEventListener('waiting', () => {
        this.isRriConnecting = true;
        this.notify();
      });

      this.rriAudio.addEventListener('error', () => {
        this.isRriConnecting = false;
        // If stream errors out due to network, graceful fallback without breaking app
        this.notify();
      });
    }

    this.rriAudio.volume = this.volume;
    this.isRriConnecting = true;
    this.rriAudio.play().catch(() => {
      this.isRriConnecting = false;
      this.notify();
    });
  }

  private stopRriStream() {
    if (this.rriAudio) {
      try {
        this.rriAudio.pause();
        this.rriAudio.currentTime = 0;
      } catch {}
      this.isRriConnecting = false;
    }
  }

  // -------------------------------------------------------------
  // 99.9 FM MALAM TENANG DARI ANTENT (CONTINUOUS LOOP + DRIVE LINK)
  // -------------------------------------------------------------
  private startMalamTenangLoop() {
    if (typeof window === 'undefined') return;

    const targetSrc = this.customDriveUrl
      ? resolveDriveAudioUrl(this.customDriveUrl)
      : DEFAULT_MALAM_TENANG_AUDIO_URL;

    if (!this.malamTenangAudio) {
      this.malamTenangAudio = new Audio();
      this.malamTenangAudio.preload = 'auto';
      this.malamTenangAudio.loop = true;

      // Ensure seamless loop even if a browser doesn't trigger native loop on custom streams
      this.malamTenangAudio.addEventListener('ended', () => {
        if (this.isPlaying && this.activeChannel === 'malam_tenang' && this.malamTenangAudio) {
          this.malamTenangAudio.currentTime = 0;
          this.malamTenangAudio.play().catch(() => {});
        }
      });

      // Automatic fallback to built-in Antent MP3 if a custom Google Drive link hits CORS/stream limits
      this.malamTenangAudio.addEventListener('error', () => {
        if (
          this.malamTenangAudio &&
          this.malamTenangAudio.src &&
          !this.malamTenangAudio.src.endsWith(DEFAULT_MALAM_TENANG_AUDIO_URL)
        ) {
          this.isUsingFallbackAudio = true;
          this.malamTenangAudio.src = DEFAULT_MALAM_TENANG_AUDIO_URL;
          this.malamTenangAudio.loop = true;
          if (this.isPlaying && this.activeChannel === 'malam_tenang') {
            this.malamTenangAudio.play().catch(() => {});
          }
          this.notify();
        }
      });
    }

    this.malamTenangAudio.loop = true;
    this.malamTenangAudio.volume = this.volume;

    const currentAttrSrc = this.malamTenangAudio.getAttribute('src');
    if (currentAttrSrc !== targetSrc) {
      this.isUsingFallbackAudio = false;
      this.malamTenangAudio.src = targetSrc;
    }

    this.malamTenangAudio.play().catch(() => {
      // Fallback to local asset if custom URL fails on play()
      if (this.malamTenangAudio && targetSrc !== DEFAULT_MALAM_TENANG_AUDIO_URL) {
        this.isUsingFallbackAudio = true;
        this.malamTenangAudio.src = DEFAULT_MALAM_TENANG_AUDIO_URL;
        this.malamTenangAudio.loop = true;
        this.malamTenangAudio.play().catch(() => {});
      }
      this.notify();
    });
  }

  private stopMalamTenangLoop() {
    if (this.malamTenangAudio) {
      try {
        this.malamTenangAudio.pause();
      } catch {}
    }
  }

  public setCustomDriveUrl(url: string) {
    this.customDriveUrl = (url || '').trim();
    this.isUsingFallbackAudio = false;
    if (typeof window !== 'undefined') {
      try {
        if (this.customDriveUrl) {
          localStorage.setItem(CUSTOM_DRIVE_URL_STORAGE_KEY, this.customDriveUrl);
        } else {
          localStorage.removeItem(CUSTOM_DRIVE_URL_STORAGE_KEY);
        }
      } catch {}
    }
    if (this.malamTenangAudio) {
      const nextSrc = this.customDriveUrl
        ? resolveDriveAudioUrl(this.customDriveUrl)
        : DEFAULT_MALAM_TENANG_AUDIO_URL;
      this.malamTenangAudio.src = nextSrc;
      this.malamTenangAudio.loop = true;
      if (this.isPlaying && this.activeChannel === 'malam_tenang') {
        this.malamTenangAudio.play().catch(() => {
          if (this.malamTenangAudio && nextSrc !== DEFAULT_MALAM_TENANG_AUDIO_URL) {
            this.isUsingFallbackAudio = true;
            this.malamTenangAudio.src = DEFAULT_MALAM_TENANG_AUDIO_URL;
            this.malamTenangAudio.play().catch(() => {});
          }
        });
      }
    }
    this.notify();
  }

  public getCustomDriveUrl(): string {
    return this.customDriveUrl;
  }

  public getIsUsingFallbackAudio(): boolean {
    return this.isUsingFallbackAudio;
  }

  // -------------------------------------------------------------
  // WARM GRAND PIANO VOICE (For Ghibli)
  // -------------------------------------------------------------
  private playGhibliPianoNote(freq: number, startTime: number, duration: number, velocity: number = 0.08) {
    if (!this.ctx || !this.masterGain) return;

    // Dual-oscillator acoustic piano body (sine fundamental + triangle 2nd harmonic)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime); // subtle 2nd octave overtone

    // Acoustic Piano ADSR Envelope
    const attack = 0.018;
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(velocity, startTime + attack);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.42, startTime + 0.35);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.25, startTime);
    osc2.connect(gain2);

    osc1.connect(noteGain);
    gain2.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.1);
    osc2.stop(startTime + duration + 0.1);
  }

  // Warm orchestral string pad for Ghibli
  private playGhibliStringSustain(freq: number, startTime: number, duration: number, velocity: number = 0.035) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const padFilter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(680, startTime);

    // Slow swell & gentle fade
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity, startTime + 0.65);
    gain.gain.exponentialRampToValueAtTime(velocity * 0.7, startTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(padFilter);
    padFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  // Glockenspiel / Music box bell twinkle for Ghibli
  private playGhibliBellNote(freq: number, startTime: number, velocity: number = 0.028) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.75);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.8);
  }

  // -------------------------------------------------------------
  // LO-FI RHODES PIANO VOICE
  // -------------------------------------------------------------
  private playRhodesNote(freq: number, startTime: number, duration: number, velocity: number = 0.065) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(velocity, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.45, startTime + 0.28);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  // Tape Crackle
  private startTapeCrackle() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const pink = lastOut * 0.95 + white * 0.05;
        lastOut = pink;
        const pop = Math.random() > 0.9996 ? (Math.random() - 0.5) * 0.35 : 0;
        data[i] = pink * 0.016 + pop;
      }

      this.crackleSource = this.ctx.createBufferSource();
      this.crackleSource.buffer = buffer;
      this.crackleSource.loop = true;

      this.crackleGain = this.ctx.createGain();
      this.crackleGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      this.crackleSource.connect(this.crackleGain);
      this.crackleGain.connect(this.masterGain);
      this.crackleSource.start();
    } catch {}
  }

  private stopTapeCrackle() {
    if (this.crackleSource) {
      try {
        this.crackleSource.stop();
        this.crackleSource.disconnect();
      } catch {}
      this.crackleSource = null;
    }
  }

  // -------------------------------------------------------------
  // SYNTH SCHEDULER (Ghibli & Lo-Fi)
  // -------------------------------------------------------------
  private tick() {
    if (!this.isPlaying || !this.ctx) return;

    if (this.activeChannel === 'rri_gorontalo' || this.activeChannel === 'malam_tenang') {
      // Stream / Loop is played via HTML5 Audio
      return;
    }

    if (this.activeChannel === 'ghibli') {
      // STUDIO GHIBLI NOSTALGIA
      const list = this.ghibliProgressions;
      const prog = list[this.currentProgIndex % list.length];
      const chord = prog[this.currentStep % prog.length];
      const now = this.ctx.currentTime + 0.04;

      const stepDuration = 2.4; // relaxed emotional tempo (~68 BPM)
      const chordDuration = stepDuration * 0.95;

      // 1. Play rolling warm acoustic piano chord (arpeggiated)
      chord.forEach((freq, idx) => {
        const arpeggioDelay = idx * 0.065;
        const vel = 0.075 - idx * 0.005;
        this.playGhibliPianoNote(freq, now + arpeggioDelay, chordDuration - arpeggioDelay, Math.max(0.025, vel));
      });

      // 2. Play warm string pad for harmony
      if (chord.length > 0) {
        this.playGhibliStringSustain(chord[0] * 0.5, now, chordDuration, 0.032);
        if (chord.length > 2) {
          this.playGhibliStringSustain(chord[2], now, chordDuration, 0.022);
        }
      }

      // 3. Play lyrical Ghibli music box / bell melody note
      if (Math.random() > 0.2) {
        const melNote = this.ghibliMelodyNotes[this.ghibliMelodyIndex % this.ghibliMelodyNotes.length];
        this.playGhibliBellNote(melNote, now + 0.25, 0.026);
        if (Math.random() > 0.4) {
          const secondMel = this.ghibliMelodyNotes[(this.ghibliMelodyIndex + 2) % this.ghibliMelodyNotes.length];
          this.playGhibliBellNote(secondMel, now + 0.85, 0.022);
        }
        this.ghibliMelodyIndex = (this.ghibliMelodyIndex + 1 + Math.floor(Math.random() * 2)) % this.ghibliMelodyNotes.length;
      }

      this.currentStep++;
      if (this.currentStep >= prog.length) {
        this.currentStep = 0;
        this.currentProgIndex = (this.currentProgIndex + 1) % list.length;
      }

      this.timerId = window.setTimeout(() => this.tick(), Math.round(stepDuration * 1000));
      return;
    }

    // LO-FI WITA
    const list = this.lofiProgressions[this.currentPeriod] || this.lofiProgressions.malam;
    const prog = list[this.currentProgIndex % list.length];
    const chord = prog[this.currentStep % prog.length];
    const now = this.ctx.currentTime + 0.05;

    const stepDuration = 2.2;
    const chordDuration = stepDuration * 0.92;

    chord.forEach((freq, idx) => {
      const strumDelay = idx * 0.052;
      const vel = 0.075 - idx * 0.006;
      this.playRhodesNote(freq, now + strumDelay, chordDuration - strumDelay, Math.max(0.02, vel));
    });

    this.currentStep++;
    if (this.currentStep >= prog.length * 2) {
      this.currentStep = 0;
      this.currentProgIndex = (this.currentProgIndex + 1) % list.length;
    }

    this.timerId = window.setTimeout(() => this.tick(), Math.round(stepDuration * 1000));
  }

  // -------------------------------------------------------------
  // PUBLIC CONTROLS
  // -------------------------------------------------------------
  public setChannel(channel: RadioChannel) {
    if (this.activeChannel === channel) return;

    const wasPlaying = this.isPlaying;
    this.stopInternal();

    this.activeChannel = channel;
    this.currentProgIndex = 0;
    this.currentStep = 0;
    this.ghibliMelodyIndex = 0;

    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public getChannel(): RadioChannel {
    return this.activeChannel;
  }

  public setTimePeriod(period: TimePeriod) {
    if (this.currentPeriod === period) return;
    this.currentPeriod = period;
    this.notify();
  }

  public getTimePeriod(): TimePeriod {
    return this.currentPeriod;
  }

  public getStationInfo(): RadioStationMeta {
    if (this.activeChannel === 'rri_gorontalo') {
      return RADIO_CHANNELS.rri_gorontalo;
    }
    if (this.activeChannel === 'malam_tenang') {
      return RADIO_CHANNELS.malam_tenang;
    }
    if (this.activeChannel === 'ghibli') {
      return RADIO_CHANNELS.ghibli;
    }
    return RADIO_STATIONS[this.currentPeriod] || RADIO_CHANNELS.lofi_wita;
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
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.activeChannel === 'rri_gorontalo') {
      this.stopMalamTenangLoop();
      this.startRriStream();
    } else if (this.activeChannel === 'malam_tenang') {
      this.stopRriStream();
      this.startMalamTenangLoop();
    } else {
      this.stopRriStream();
      this.stopMalamTenangLoop();
      this.initContext();
      if (this.activeChannel === 'lofi_wita') {
        this.startTapeCrackle();
      }
      this.tick();
    }
    this.notify();
  }

  public stop() {
    this.stopInternal();
    this.notify();
  }

  private stopInternal() {
    this.isPlaying = false;
    this.stopRriStream();
    this.stopMalamTenangLoop();
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.stopTapeCrackle();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.rriAudio) {
      this.rriAudio.volume = this.volume;
    }
    if (this.malamTenangAudio) {
      this.malamTenangAudio.volume = this.volume;
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsRriConnecting(): boolean {
    return this.isRriConnecting;
  }

  public subscribe(cb: (playing: boolean, vol: number, channel: RadioChannel, meta: RadioStationMeta) => void): () => void {
    this.listeners.add(cb);
    cb(this.isPlaying, this.volume, this.activeChannel, this.getStationInfo());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const meta = this.getStationInfo();
    this.listeners.forEach((cb) => cb(this.isPlaying, this.volume, this.activeChannel, meta));
  }
}

export const lofiMusic = new RadioAndMusicEngine();
