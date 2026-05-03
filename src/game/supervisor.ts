import type { ShiftLog, SupervisorConfig } from "./types";

export type SupervisorReview = {
  sample: ShiftLog[];
  wrongInSample: number;
  penalty: number;
};

export function reviewShift(
  log: ShiftLog[],
  config: SupervisorConfig,
  rand: () => number,
): SupervisorReview {
  const size = Math.min(config.sampleSize, log.length);
  const sample = pickN(log, size, rand);
  const wrongInSample = sample.filter((l) => !l.correct).length;
  const penalty = wrongInSample * config.penaltyPerWrong;
  return { sample, wrongInSample, penalty };
}

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  if (n >= arr.length) return [...arr];
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}
