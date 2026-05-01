import type { Car, Doc, Street, ZoneCode } from "./types";
import { streetsForDay, STREETS } from "./streets";
import { activeRules } from "./rules";
import { validate } from "./validate";

const COLOURS = ["Red", "Blue", "Black", "Silver", "White", "Green", "Grey"];
const MODELS = [
  "Ford Fiesta",
  "VW Golf",
  "Mini Cooper",
  "Vauxhall Corsa",
  "Nissan Qashqai",
  "BMW 3 Series",
  "Toyota Yaris",
  "Land Rover Discovery",
  "Hyundai i10",
  "Peugeot 208",
];

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function plate(r: () => number): string {
  const L = "ABCDEFGHJKLMNOPRSTUVWXYZ";
  const N = "0123456789";
  const a = pick([...L], r) + pick([...L], r);
  const n = pick([...N], r) + pick([...N], r);
  const c = pick([...L], r) + pick([...L], r) + pick([...L], r);
  return `${a}${n} ${c}`;
}

function buildPD(zone: ZoneCode, expiresAt: number): Doc {
  return { type: "pd", zone, expiresAt };
}

function buildPermit(zone: ZoneCode, plateStr: string): Doc {
  return {
    type: "permit",
    zone,
    plate: plateStr,
    validUntil: "31/12/2026",
  };
}

function buildBadge(clockShown: boolean, clockSetAt: number | null): Doc {
  return {
    type: "blue-badge",
    holder: "BERNARD HOLLAND",
    validUntil: "30/06/2027",
    clockShown,
    clockSetAt,
  };
}

const HOLDERS = [
  "MARGARET DAWES",
  "BERNARD HOLLAND",
  "PRIYA SHAH",
  "DEREK FOSTER",
  "ELSIE WHITTAKER",
];

export type GenOpts = {
  day: number;
  count: number;
  shiftStart: number;
  seed: number;
};

export function generateCars(opts: GenOpts): Car[] {
  const r = rng(opts.seed);
  const streets = streetsForDay(opts.day);
  const rules = activeRules(opts.day);
  const cars: Car[] = [];

  for (let i = 0; i < opts.count; i++) {
    const street = pick(streets, r);
    const carPlate = plate(r);
    const docs = generateDocs(opts.day, street, carPlate, opts.shiftStart, r);
    const car: Car = {
      id: `car-${i}`,
      plate: carPlate,
      colour: pick(COLOURS, r),
      model: pick(MODELS, r),
      street,
      docs,
      truth: [],
    };
    const truth = validate(car, rules, opts.shiftStart + 30);
    car.truth = truth;
    cars.push(car);
  }

  return cars;
}

function generateDocs(
  day: number,
  street: Street,
  carPlate: string,
  shiftStart: number,
  r: () => number,
): Doc[] {
  const docs: Doc[] = [];
  const violationRoll = r();

  if (street.kind === "pay-and-display") {
    if (violationRoll < 0.55) {
      docs.push(buildPD(null, shiftStart + 60 + Math.floor(r() * 120)));
    } else if (violationRoll < 0.8) {
      docs.push(buildPD(null, shiftStart - 30 - Math.floor(r() * 90)));
    } else {
      // no ticket
    }
  }

  if (street.kind === "permit") {
    if (violationRoll < 0.55) {
      docs.push(buildPermit(street.zone, carPlate));
    } else if (violationRoll < 0.7) {
      const wrongZone: ZoneCode = street.zone === "A" ? "B" : "A";
      docs.push(buildPermit(wrongZone, carPlate));
    } else if (violationRoll < 0.85) {
      docs.push(buildPermit(street.zone, mutatePlate(carPlate, r)));
    } else {
      // no permit
    }
  }

  if (street.kind === "double-yellow") {
    if (violationRoll < 0.4) {
      docs.push(buildBadge(true, shiftStart + Math.floor(r() * 60)));
    } else if (violationRoll < 0.55) {
      docs.push(buildBadge(true, shiftStart - 240 - Math.floor(r() * 60)));
    } else if (violationRoll < 0.75) {
      docs.push(buildBadge(false, null));
    } else {
      // no badge at all
    }
  }

  // Sometimes throw an extra unrelated doc on a clean car (e.g. lapsed P&D
  // when on permit street) to force the player to actually read.
  if (day >= 2 && r() < 0.15 && street.kind !== "pay-and-display") {
    docs.push(buildPD(null, shiftStart - 60));
  }

  return docs;
}

function mutatePlate(p: string, r: () => number): string {
  const chars = p.split("");
  const idx = Math.floor(r() * chars.length);
  if (chars[idx] === " ") return mutatePlate(p, r);
  const L = "ABCDEFGHJKLMNOPRSTUVWXYZ0123456789";
  chars[idx] = L[Math.floor(r() * L.length)];
  return chars.join("");
}

export function holderName(seed: number): string {
  return HOLDERS[seed % HOLDERS.length];
}

export { STREETS };
