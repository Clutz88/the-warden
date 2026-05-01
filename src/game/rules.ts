import type { Rule, Violation } from "./types";

export const PCN_CODES: Record<string, string> = {
  "01": "Parked in restricted street (no valid P&D)",
  "12": "Parked in resident permit zone without permit",
  "25": "Parked in loading bay outside permitted hours",
  "40": "Parked on double yellows without exemption",
};

const v = (code: string): Violation => ({ code, label: PCN_CODES[code] });

export const RULES: Rule[] = [
  {
    id: "pd-required",
    firstDay: 1,
    check: ({ car, clock }) => {
      if (car.street.kind !== "pay-and-display") return null;
      const pd = car.docs.find((d) => d.type === "pd");
      if (!pd) return v("01");
      if (pd.expiresAt < clock) return v("01");
      return null;
    },
  },
  {
    id: "permit-zone-match",
    firstDay: 2,
    check: ({ car }) => {
      if (car.street.kind !== "permit") return null;
      const permit = car.docs.find((d) => d.type === "permit");
      if (!permit) return v("12");
      if (permit.zone !== car.street.zone) return v("12");
      if (permit.plate !== car.plate) return v("12");
      return null;
    },
  },
  {
    id: "double-yellow",
    firstDay: 3,
    check: ({ car, clock }) => {
      if (car.street.kind !== "double-yellow") return null;
      const badge = car.docs.find((d) => d.type === "blue-badge");
      if (!badge) return v("40");
      if (!badge.clockShown || badge.clockSetAt == null) return v("40");
      const minutesParked = clock - badge.clockSetAt;
      if (minutesParked > 180) return v("40");
      return null;
    },
  },
];

export function activeRules(day: number): Rule[] {
  return RULES.filter((r) => r.firstDay <= day);
}
