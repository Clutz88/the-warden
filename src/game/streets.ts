import type { Street } from "./types";
import { DAYS, getDay } from "./days";
import streetsRaw from "../data/streets.json";

const list = streetsRaw as Street[];

export const STREETS: Record<string, Street> = Object.fromEntries(list.map((s) => [s.id, s]));

export function streetsForDay(day: number): Street[] {
  return getDay(day).streets.map((id) => {
    const s = STREETS[id];
    if (!s) throw new Error(`Unknown street id "${id}" on day ${day}`);
    return s;
  });
}

for (const d of DAYS) {
  for (const id of d.streets) {
    if (!STREETS[id]) {
      throw new Error(`DAYS[day=${d.day}] references unknown street id "${id}"`);
    }
  }
}
