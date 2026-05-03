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
let melodyBus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = readMuted();
let started = false;
let melodyCooldown = 2; // chords until next phrase

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
  melodyBus = ctx.createGain();
  melodyBus.gain.value = 0.45;
  melodyBus.connect(masterGain);
  // Light feedback delay sweetens lead lines without turning into a wash.
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.42;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.28;
  melodyBus.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(masterGain);
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
  maybeScheduleMelody(idx, startAt, dur);

  setTimeout(() => scheduleChord((idx + 1) % PROGRESSION.length), CHORD_MS);
}

// A natural minor scale (octave 4/5). Lower register sits closer to the pad,
// helping the lead blend with the underlying voicings instead of cutting over.
const N = {
  A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33,
  E5: 659.25, F5: 698.46, G5: 784.0, A5: 880.0,
};

type Note = { f: number; beats: number };

// Composed 8-bar lead, one bar per chord across the full progression twice.
// Bar boundaries align with PROGRESSION (Am F Cmaj7 Esus4 | Am F Cmaj7 Esus4),
// so the melody must only be triggered when chordIdx === 0.
//   A: opening — tonic, gentle stepwise motion (Am)
//   B: leap to F natural for colour, settle on F (F)
//   C: descending answer through C major's 3rd & 5th (Cmaj7)
//   D: turn around the dominant centre on E (Esus4)
//   E: rises higher to A5 — climactic phrase (Am)
//   F: reaches G5, descends back to F (F)
//   G: stepwise resolution toward C (Cmaj7)
//   H: half cadence, breath before loop (Esus4)
const MELODY: Note[] = [
  // bar A — Am
  { f: N.A4, beats: 2 }, { f: N.C5, beats: 1 }, { f: N.B4, beats: 1 },
  // bar B — F
  { f: N.A4, beats: 1 }, { f: N.C5, beats: 1 }, { f: N.F5, beats: 2 },
  // bar C — Cmaj7
  { f: N.E5, beats: 1 }, { f: N.D5, beats: 0.5 }, { f: N.C5, beats: 0.5 }, { f: N.D5, beats: 2 },
  // bar D — Esus4
  { f: N.E5, beats: 2 }, { f: N.B4, beats: 1 }, { f: N.A4, beats: 1 },
  // bar E — Am (answer, higher)
  { f: N.C5, beats: 1 }, { f: N.E5, beats: 1 }, { f: N.A5, beats: 2 },
  // bar F — F
  { f: N.G5, beats: 1 }, { f: N.F5, beats: 0.5 }, { f: N.E5, beats: 0.5 }, { f: N.F5, beats: 2 },
  // bar G — Cmaj7
  { f: N.E5, beats: 1 }, { f: N.D5, beats: 1 }, { f: N.C5, beats: 2 },
  // bar H — Esus4 (half cadence)
  { f: N.B4, beats: 2 }, { f: N.A4, beats: 2 },
];

function maybeScheduleMelody(chordIdx: number, startAt: number, chordDur: number): void {
  if (!ctx || !melodyBus) return;
  // Lead phrases span the full 8-bar progression, so only kick off on Am.
  if (chordIdx !== 0) return;
  if (--melodyCooldown > 0) return;
  // Sit out 2-4 full progressions (32-64s) before the next rendition.
  melodyCooldown = 4 * (2 + Math.floor(Math.random() * 3));

  const beat = chordDur / 4;
  let t = startAt;
  for (let i = 0; i < MELODY.length; i++) {
    const note = MELODY[i];
    const next = MELODY[i + 1];
    const dur = note.beats * beat;
    // Tie into the next note (or longer release at phrase end) for legato.
    const tail = next ? Math.min(0.18, dur * 0.4) : 0.6;
    playMelodyNote(t, note.f, dur, tail);
    t += dur;
  }
}

function playMelodyNote(at: number, freq: number, dur: number, tail: number): void {
  if (!ctx || !melodyBus) return;
  const total = dur + tail;

  // Voice 1: triangle main.
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;
  // Voice 2: sine an octave below at low gain — adds body, blends with pad.
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = freq / 2;

  // Filter: keep highs in check so the lead doesn't sit "on top".
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1500;
  filter.Q.value = 0.3;

  const env = ctx.createGain();
  const subGain = ctx.createGain();
  subGain.gain.value = 0.35;

  // Soft attack and longer release for vocal-like phrasing.
  const peak = 0.42;
  const attack = Math.min(0.12, dur * 0.35);
  const decayTo = 0.32;
  const decay = Math.min(0.25, dur * 0.4);
  const sustainEnd = at + dur;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(peak, at + attack);
  env.gain.exponentialRampToValueAtTime(decayTo, at + attack + decay);
  env.gain.setValueAtTime(decayTo, sustainEnd);
  env.gain.exponentialRampToValueAtTime(0.0001, at + total);

  // Gentle vibrato on notes that hold long enough to need it.
  if (dur >= 0.6) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.2;
    lfoGain.gain.value = 6; // cents
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    lfoGain.connect(sub.detune);
    lfo.start(at + attack * 0.5);
    lfo.stop(at + total);
  }

  osc.connect(filter);
  sub.connect(subGain);
  subGain.connect(filter);
  filter.connect(env);
  env.connect(melodyBus);
  osc.start(at);
  osc.stop(at + total + 0.05);
  sub.start(at);
  sub.stop(at + total + 0.05);
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
