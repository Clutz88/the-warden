import type {Car, CarSpec, Doc, ResidentEncounter, Street, StreetKind, ZoneCode} from "./types";
import {STREETS, streetsForDay} from "./streets";
import {activeRules} from "./rules";
import {validate} from "./validate";
import {getDay} from "./days";
import {maybeResident, pickNote, residentById} from "./residents";

export const PER_CAR_MINUTES = 12;

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

const PLATE_LETTERS = "ABCDEFGHJKLMNOPRSTUVWXYZ";
const PLATE_DIGITS = "0123456789";

function L(r: () => number, n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += PLATE_LETTERS[Math.floor(r() * PLATE_LETTERS.length)];
  return s;
}

function N(r: () => number, n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += PLATE_DIGITS[Math.floor(r() * PLATE_DIGITS.length)];
  return s;
}

// Mix of UK plate formats. Modern (current) dominates; historic and Northern
// Irish formats appear occasionally so the player can't pattern-match on shape.
function plate(r: () => number): string {
  const roll = r();
  if (roll < 0.78) return `${L(r, 2)}${N(r, 2)} ${L(r, 3)}`;          // Modern: AB12 CDE
  if (roll < 0.90) return `${L(r, 1)}${N(r, 3)} ${L(r, 3)}`;          // Prefix style (1983–2001): K123 ABC
  if (roll < 0.96) return `${L(r, 3)} ${N(r, 4)}`;                    // Northern Ireland: LRZ 1234
  return `${L(r, 3)} ${N(r, 3)}${L(r, 1)}`;                           // Suffix style (pre-1983): ABC 123A
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

const LOADING_FIRMS = [
  "PARCELFLEET LTD",
  "ASHBRIDGE COURIERS",
  "DPL EXPRESS",
  "GREENVAN HAULAGE",
  "MERIDIAN FREIGHT",
];

function buildLoadingSlip(arrivedAt: number, r: () => number): Doc {
  return {
    type: "loading-slip",
    firm: LOADING_FIRMS[Math.floor(r() * LOADING_FIRMS.length)]!,
    arrivedAt,
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
  residentHistory?: Record<string, ResidentEncounter[]>;
};

export function generateCars(opts: GenOpts): Car[] {
  const r = rng(opts.seed);
  const streets = streetsForDay(opts.day);
  const rules = activeRules(opts.day);
  const def = getDay(opts.day);
  const cars: Car[] = [];

  for (let i = 0; i < opts.count; i++) {
    const street = pick(streets, r);
    const resident = maybeResident({
      pool: def.residentPool,
      chance: def.residentChance,
      rand: r,
    });
    const carPlate = resident ? resident.plate : plate(r);
    const docs = generateDocs(opts.day, street, carPlate, opts.shiftStart, r);
    if (resident) {
      const history = opts.residentHistory?.[resident.id] ?? [];
      const text = pickNote(resident, history);
      if (text) docs.push({ type: "note", from: resident.name, text });
    }
    const seenAt = opts.shiftStart + i * PER_CAR_MINUTES;
    const car: Car = {
      id: `car-${i}`,
      plate: carPlate,
      colour: pick(COLOURS, r),
      model: pick(MODELS, r),
      street,
      docs,
      truth: [],
      seenAt,
      ...(resident ? { residentId: resident.id } : {}),
    };
    car.truth = validate(car, rules, seenAt);
    cars.push(car);
  }

  return cars;
}

export function buildCars(
  specs: CarSpec[],
  day: number,
  residentHistory?: Record<string, ResidentEncounter[]>,
): Car[] {
  const rules = activeRules(day);
  return specs.map((spec, i) => {
    const street = STREETS[spec.street];
    if (!street) {
      throw new Error(`Day ${day} car ${i}: unknown street "${spec.street}"`);
    }
    const docs = [...spec.docs];
    if (spec.residentId) {
      const resident = residentById(spec.residentId);
      if (!resident) {
        throw new Error(`Day ${day} car ${i}: unknown residentId "${spec.residentId}"`);
      }
      const history = residentHistory?.[resident.id] ?? [];
      const text = pickNote(resident, history);
      if (text && !docs.some((d) => d.type === "note")) {
        docs.push({ type: "note", from: resident.name, text });
      }
    }
    const car: Car = {
      id: `car-${i}`,
      plate: spec.plate,
      colour: spec.colour,
      model: spec.model,
      street,
      docs,
      truth: [],
      seenAt: spec.seenAt,
      ...(spec.residentId ? { residentId: spec.residentId } : {}),
    };
    car.truth = validate(car, rules, spec.seenAt);
    return car;
  });
}

type DocBuilderCtx = {
  street: Street;
  carPlate: string;
  shiftStart: number;
  r: () => number;
  violationRoll: number;
};

const DOC_BUILDERS: Record<StreetKind, (c: DocBuilderCtx) => Doc[]> = {
  "pay-and-display": ({ shiftStart, r, violationRoll }) => {
    if (violationRoll < 0.55) return [buildPD(null, shiftStart + 60 + Math.floor(r() * 120))];
    if (violationRoll < 0.8) return [buildPD(null, shiftStart - 30 - Math.floor(r() * 90))];
    return [];
  },
  permit: ({ street, carPlate, r, violationRoll }) => {
    if (violationRoll < 0.55) return [buildPermit(street.zone, carPlate)];
    if (violationRoll < 0.7) {
      const wrongZone: ZoneCode = street.zone === "A" ? "B" : "A";
      return [buildPermit(wrongZone, carPlate)];
    }
    if (violationRoll < 0.85) return [buildPermit(street.zone, mutatePlate(carPlate, r))];
    return [];
  },
  "loading-bay": ({ shiftStart, r, violationRoll }) => {
    if (violationRoll < 0.55) return [buildLoadingSlip(shiftStart - Math.floor(r() * 25), r)];
    if (violationRoll < 0.8) return [buildLoadingSlip(shiftStart - 60 - Math.floor(r() * 90), r)];
    return [];
  },
  "double-yellow": ({ shiftStart, r, violationRoll }) => {
    if (violationRoll < 0.4) return [buildBadge(true, shiftStart + Math.floor(r() * 60))];
    if (violationRoll < 0.55) return [buildBadge(true, shiftStart - 240 - Math.floor(r() * 60))];
    if (violationRoll < 0.75) return [buildBadge(false, null)];
    return [];
  },
  "single-yellow": () => [],
};

function generateDocs(
  day: number,
  street: Street,
  carPlate: string,
  shiftStart: number,
  r: () => number,
): Doc[] {
  const violationRoll = r();
  const docs = DOC_BUILDERS[street.kind]({
    street,
    carPlate,
    shiftStart,
    r,
    violationRoll,
  });

  // Decoy: occasionally drop an unrelated doc on a non-P&D car so the player
  // can't pattern-match by doc type alone.
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
