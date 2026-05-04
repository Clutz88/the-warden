import type { Street } from "./types";
import { DAYS, getDay } from "./days";

export const STREETS: Record<string, Street> = {
  highRoad: {
    id: "highRoad",
    name: "High Road",
    kind: "pay-and-display",
    zone: null,
  },
  marketSt: {
    id: "marketSt",
    name: "Market Street",
    kind: "pay-and-display",
    zone: null,
  },
  abbeyClose: {
    id: "abbeyClose",
    name: "Abbey Close",
    kind: "permit",
    zone: "A",
  },
  victoriaTerr: {
    id: "victoriaTerr",
    name: "Victoria Terrace",
    kind: "permit",
    zone: "B",
  },
  churchLane: {
    id: "churchLane",
    name: "Church Lane",
    kind: "double-yellow",
    zone: null,
  },
  bishopsWay: {
    id: "bishopsWay",
    name: "Bishop's Way",
    kind: "loading-bay",
    zone: null,
  },
};

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
