const MUTE_KEY = "warden:muted";
const MASTER_LEVEL = 0.18;

type Chord = number[];

// Am — F — Cmaj7 — Esus4. Frequencies in Hz, low octave for pad feel.
const PROGRESSION: Chord[] = [
  [220.0, 261.63, 329.63],         // A3 C4 E4   (Am)
  [174.61, 220.0, 261.63],         // F3 A3 C4   (F)
  [261.63, 329.63, 392.0, 493.88], // C4 E4 G4 B4 (Cmaj7)
  [164.81, 246.94, 329.63],        // E3 B3 E4   (Esus4-ish)
];
const CHORD_MS = 4000;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let drumBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = readMuted();
let started = false;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistMuted(v: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, String(v));
  } catch {}
}

export function isMuted(): boolean {
  return muted;
}

export function startMusic(): void {
  if (started) return;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : MASTER_LEVEL;
  masterGain.connect(ctx.destination);
  drumBus = ctx.createGain();
  drumBus.gain.value = 0.55;
  drumBus.connect(masterGain);
  started = true;
  scheduleChord(0);
}

export function setMuted(v: boolean): void {
  muted = v;
  persistMuted(v);
  if (ctx && masterGain) {
    const now = ctx.currentTime;
    const target = v ? 0 : MASTER_LEVEL;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(target, now + 0.15);
  }
}

function scheduleChord(idx: number): void {
  if (!ctx || !masterGain) return;
  const chord = PROGRESSION[idx];
  const startAt = ctx.currentTime;
  const dur = CHORD_MS / 1000;
  const attack = 1.0;
  const release = 1.0;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.6;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, startAt);
  env.gain.linearRampToValueAtTime(0.5, startAt + attack);
  env.gain.setValueAtTime(0.5, startAt + dur - release);
  env.gain.linearRampToValueAtTime(0, startAt + dur);

  filter.connect(env);
  env.connect(masterGain);

  const oscs: OscillatorNode[] = [];
  for (const f of chord) {
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(startAt);
      osc.stop(startAt + dur + 0.05);
      oscs.push(osc);
    }
  }

  scheduleDrums(startAt, dur);

  setTimeout(() => scheduleChord((idx + 1) % PROGRESSION.length), CHORD_MS);
}

function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(c.sampleRate * 0.4);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

function playKick(at: number): void {
  if (!ctx || !drumBus) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(95, at);
  osc.frequency.exponentialRampToValueAtTime(38, at + 0.12);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.6, at + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
  osc.connect(env);
  env.connect(drumBus);
  osc.start(at);
  osc.stop(at + 0.25);
}

function playHat(at: number, accent: boolean): void {
  if (!ctx || !drumBus) return;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const env = ctx.createGain();
  const peak = accent ? 0.12 : 0.06;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(peak, at + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  src.connect(hp);
  hp.connect(env);
  env.connect(drumBus);
  src.start(at);
  src.stop(at + 0.08);
}

function scheduleDrums(startAt: number, dur: number): void {
  // 4 beats per chord. Kick on 1 & 3, hat on every beat (accent on 2 & 4).
  const beat = dur / 4;
  for (let i = 0; i < 4; i++) {
    const t = startAt + i * beat;
    if (i === 0 || i === 2) playKick(t);
    playHat(t, i === 1 || i === 3);
  }
}
