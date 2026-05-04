import type { Car, Rule, Violation } from "./types";

export function validate(car: Car, rules: Rule[], clock: number): Violation[] {
  const out: Violation[] = [];
  for (const r of rules) {
    if (r.check({ car, clock })) {
      out.push({ code: r.code, label: r.label });
    }
  }
  return out;
}
