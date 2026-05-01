import type { Street } from "./types";

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
};

export function streetsForDay(day: number): Street[] {
  if (day === 1) return [STREETS.highRoad, STREETS.marketSt];
  if (day === 2)
    return [
      STREETS.highRoad,
      STREETS.marketSt,
      STREETS.abbeyClose,
      STREETS.victoriaTerr,
    ];
  return Object.values(STREETS);
}
