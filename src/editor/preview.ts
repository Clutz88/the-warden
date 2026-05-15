import type { CarSpecRaw, DayDefRaw } from "../game/types";
import { loadDay } from "../game/days";
import { buildCars } from "../game/cars";

export type CarTruth =
  | { kind: "ok"; codes: string[] }
  | { kind: "error"; message: string };

export type DraftPreview = {
  load: { kind: "ok" } | { kind: "error"; message: string };
  perCar: CarTruth[];
};

export function previewDraft(raw: DayDefRaw): DraftPreview {
  const perCar: CarTruth[] = raw.cars.map((c) => previewCar(c));
  try {
    const def = loadDay(raw);
    if (!def.cars) {
      return { load: { kind: "ok" }, perCar };
    }
    const built = buildCars(def.cars, raw.day);
    return {
      load: { kind: "ok" },
      perCar: built.map((b) => ({
        kind: "ok" as const,
        codes: b.truth.map((t) => t.code),
      })),
    };
  } catch (err) {
    return { load: { kind: "error", message: String(err) }, perCar };
  }
}

function previewCar(spec: CarSpecRaw): CarTruth {
  // shallow checks only; real truth comes from full loadDay+buildCars pass above
  if (!/^([0-2]\d):([0-5]\d)$/.test(spec.seenAt)) {
    return { kind: "error", message: `Bad seenAt "${spec.seenAt}"` };
  }
  return { kind: "ok", codes: [] };
}
