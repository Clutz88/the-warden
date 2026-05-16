import type { Tuning, TuningRaw } from "./types";
import raw from "../data/tuning.json";

function parseClock(s: string): number {
  const m = /^([0-2]\d):([0-5]\d)$/.exec(s);
  if (!m) throw new Error(`Invalid shiftStart "${s}", expected "HH:MM"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23) throw new Error(`Invalid shiftStart "${s}": hours > 23`);
  return h * 60 + min;
}

const r = raw as TuningRaw;
export const TUNING: Tuning = {
  shiftStart: parseClock(r.shiftStart),
  wages: {
    correct: r.wages.correct,
    wrong: r.wages.wrong,
    flawlessBonus: r.wages.flawlessBonus,
  },
};
