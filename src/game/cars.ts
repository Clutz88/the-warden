import type { Car, CarSpec, Doc, DocReactiveNote, ResidentEncounter, ToneCode } from "./types";
import { STREETS } from "./streets";
import { activeRules } from "./rules";
import { validate } from "./validate";
import { residentById } from "./residents";

export function toneFromHistory(history: ResidentEncounter[] | undefined): ToneCode {
  const last = history && history.length ? history[history.length - 1] : null;
  if (!last) return "neutral";
  return last.action.kind === "pcn" ? "negative" : "positive";
}

export function pickReactiveVariant(doc: DocReactiveNote, tone: ToneCode): string | null {
  return doc.variants[tone] ?? doc.variants.neutral ?? null;
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
    if (spec.residentId && !residentById(spec.residentId)) {
      throw new Error(`Day ${day} car ${i}: unknown residentId "${spec.residentId}"`);
    }

    const history = spec.residentId ? residentHistory?.[spec.residentId] : undefined;
    const tone = toneFromHistory(history);

    const docs: Doc[] = [];
    for (const d of spec.docs) {
      if (d.type === "reactive-note") {
        const text = pickReactiveVariant(d, tone);
        if (text) docs.push({ type: "note", from: d.from, text });
      } else {
        docs.push(d);
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
