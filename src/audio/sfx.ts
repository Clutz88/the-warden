import { getAudioContext, getSfxBus, isMuted } from "./music";

function ready(): { ctx: AudioContext; bus: GainNode } | null {
  if (isMuted()) return null;
  const ctx = getAudioContext();
  const bus = getSfxBus();
  if (!ctx || !bus) return null;
  return { ctx, bus };
}

function envBlip(
  ctx: AudioContext,
  bus: GainNode,
  type: OscillatorType,
  freq: number,
  dur: number,
  peak: number,
  freqEnd?: number,
): void {
  const at = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, at + dur);
  }
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(peak, at + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(env);
  env.connect(bus);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function playPass(): void {
  const r = ready();
  if (!r) return;
  // Two-note ascending sine ding (G5 → C6).
  envBlip(r.ctx, r.bus, "sine", 784, 0.09, 0.4);
  const at = r.ctx.currentTime + 0.07;
  const osc = r.ctx.createOscillator();
  const env = r.ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1046.5;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.42, at + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
  osc.connect(env);
  env.connect(r.bus);
  osc.start(at);
  osc.stop(at + 0.18);
}

export function playPcn(): void {
  const r = ready();
  if (!r) return;
  // Stamp: short noise burst through lowpass.
  const at = r.ctx.currentTime;
  const len = Math.floor(r.ctx.sampleRate * 0.12);
  const buf = r.ctx.createBuffer(1, len, r.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = r.ctx.createBufferSource();
  src.buffer = buf;
  const lp = r.ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1200;
  lp.Q.value = 0.7;
  const env = r.ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.55, at + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
  src.connect(lp);
  lp.connect(env);
  env.connect(r.bus);
  src.start(at);
  src.stop(at + 0.13);
  // Add a low thunk under the noise for weight.
  envBlip(r.ctx, r.bus, "sine", 140, 0.09, 0.35, 60);
}

export function playMistake(): void {
  const r = ready();
  if (!r) return;
  // Square buzzer, descending.
  envBlip(r.ctx, r.bus, "square", 220, 0.22, 0.22, 165);
}

export function playStamp(): void {
  playPcn();
}

export function playClick(): void {
  const r = ready();
  if (!r) return;
  envBlip(r.ctx, r.bus, "triangle", 1200, 0.04, 0.18);
}
