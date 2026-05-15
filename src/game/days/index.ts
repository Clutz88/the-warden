import type {
  CarSpec,
  CarSpecRaw,
  DayDef,
  DayDefRaw,
  Doc,
  DocRaw,
} from "../types";
import { residentById } from "../residents";

const RAW_MODULES = import.meta.glob<{ default: DayDefRaw }>("./day*.json", {
  eager: true,
});

export function parseClock(s: string): number {
  const m = /^([0-2]\d):([0-5]\d)$/.exec(s);
  if (!m) throw new Error(`Invalid clock "${s}", expected "HH:MM"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23) throw new Error(`Invalid clock "${s}": hours > 23`);
  return h * 60 + min;
}

function parseDoc(doc: DocRaw, ctx: string): Doc {
  switch (doc.type) {
    case "pd":
      return { type: "pd", zone: doc.zone, expiresAt: parseClock(doc.expiresAt) };
    case "permit":
      return {
        type: "permit",
        zone: doc.zone,
        plate: doc.plate,
        validUntil: doc.validUntil,
      };
    case "blue-badge":
      return {
        type: "blue-badge",
        holder: doc.holder,
        validUntil: doc.validUntil,
        clockShown: doc.clockShown,
        clockSetAt: doc.clockSetAt == null ? null : parseClock(doc.clockSetAt),
      };
    case "note":
      return { type: "note", from: doc.from, text: doc.text };
    case "loading-slip":
      return {
        type: "loading-slip",
        firm: doc.firm,
        arrivedAt: parseClock(doc.arrivedAt),
      };
    case "reactive-note":
      return { type: "reactive-note", from: doc.from, variants: { ...doc.variants } };
    default: {
      const _exhaustive: never = doc;
      throw new Error(`${ctx}: unknown doc type ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function parseCar(spec: CarSpecRaw, ctx: string): CarSpec {
  if (spec.residentId && !residentById(spec.residentId)) {
    throw new Error(`${ctx}: unknown residentId "${spec.residentId}"`);
  }
  return {
    seenAt: parseClock(spec.seenAt),
    plate: spec.plate,
    colour: spec.colour,
    model: spec.model,
    street: spec.street,
    docs: spec.docs.map((d, i) => parseDoc(d, `${ctx} doc ${i}`)),
    ...(spec.residentId ? { residentId: spec.residentId } : {}),
  };
}

export function loadDay(raw: DayDefRaw): DayDef {
  const cars = raw.cars.map((c, i) => parseCar(c, `Day ${raw.day} car ${i}`));
  for (let i = 1; i < cars.length; i++) {
    if (cars[i]!.seenAt < cars[i - 1]!.seenAt) {
      throw new Error(
        `Day ${raw.day}: car ${i} seenAt ${cars[i]!.seenAt} is before car ${i - 1} seenAt ${cars[i - 1]!.seenAt}`,
      );
    }
  }
  return {
    day: raw.day,
    briefing: raw.briefing,
    newRuleSummary: raw.newRuleSummary,
    streets: raw.streets,
    rent: raw.rent,
    cars,
    ...(raw.supervisor ? { supervisor: raw.supervisor } : {}),
  };
}

function discoverRawDays(): DayDefRaw[] {
  const found: { day: number; raw: DayDefRaw }[] = [];
  for (const [path, mod] of Object.entries(RAW_MODULES)) {
    const m = /day(\d+)\.json$/.exec(path);
    if (!m) continue;
    found.push({ day: Number(m[1]), raw: mod.default });
  }
  found.sort((a, b) => a.day - b.day);
  return found.map((f) => f.raw);
}

export const DAYS: DayDef[] = discoverRawDays().map((raw) => loadDay(raw));

export function getDay(n: number): DayDef {
  return DAYS[n - 1] ?? DAYS[DAYS.length - 1]!;
}
