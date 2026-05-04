import type { Rule } from "./types";

export const RULES: Rule[] = [
  {
    id: "pd-required",
    code: "01",
    label: "Parked in restricted street (no valid P&D)",
    firstDay: 1,
    check: ({ car, clock }) => {
      if (car.street.kind !== "pay-and-display") return false;
      const pd = car.docs.find((d) => d.type === "pd");
      if (!pd) return true;
      return pd.expiresAt < clock;

    },
  },
  {
    id: "permit-zone-match",
    code: "12",
    label: "Parked in resident permit zone without permit",
    firstDay: 2,
    check: ({ car }) => {
      if (car.street.kind !== "permit") return false;
      const permit = car.docs.find((d) => d.type === "permit");
      if (!permit) return true;
      if (permit.zone !== car.street.zone) return true;
      return permit.plate !== car.plate;

    },
  },
  {
    id: "double-yellow",
    code: "40",
    label: "Parked on double yellows without exemption",
    firstDay: 3,
    check: ({ car, clock }) => {
      if (car.street.kind !== "double-yellow") return false;
      const badge = car.docs.find((d) => d.type === "blue-badge");
      if (!badge) return true;
      if (!badge.clockShown || badge.clockSetAt == null) return true;
      const minutesParked = clock - badge.clockSetAt;
      return minutesParked > 180;

    },
  },
  {
    id: "loading-bay-overstay",
    code: "25",
    label: "Parked in loading bay outside permitted hours",
    firstDay: 6,
    check: ({ car, clock }) => {
      if (car.street.kind !== "loading-bay") return false;
      const slip = car.docs.find((d) => d.type === "loading-slip");
      if (!slip) return true;
      const minutesParked = clock - slip.arrivedAt;
      return minutesParked > 30;

    },
  },
];

export const PCN_CODES: Record<string, string> = Object.fromEntries(
  RULES.map((r) => [r.code, r.label]),
);

export function activeRules(day: number): Rule[] {
  return RULES.filter((r) => r.firstDay <= day);
}
