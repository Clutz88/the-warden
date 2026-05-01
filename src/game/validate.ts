import type { Car, Rule, Violation } from "./types";

export function validate(car: Car, rules: Rule[], clock: number): Violation[] {
  const out: Violation[] = [];
  for (const r of rules) {
    const v = r.check({ car, clock });
    if (v) out.push(v);
  }
  return out;
}
