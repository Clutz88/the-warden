import type { DayDef } from "./types";

export const DAYS: DayDef[] = [
  {
    day: 1,
    briefing:
      "Borough of Ashbridge — first shift. Today you patrol the Pay & Display bays on High Road and Market Street. Issue a PCN to any car without a valid Pay & Display ticket, or whose ticket has expired. Otherwise, let them pass.",
    newRuleSummary: [
      "Pay & Display required on High Road and Market Street.",
      "Ticket must not be expired (compare against your shift clock).",
    ],
    carCount: 6,
    streets: ["High Road", "Market Street"],
    rent: 30,
  },
  {
    day: 2,
    briefing:
      "New zones added to your patrol: Abbey Close (Zone A) and Victoria Terrace (Zone B). Residents must show a permit matching the zone of the street, AND the registration on the permit must match the car's plate. P&D rules still apply on the high streets.",
    newRuleSummary: [
      "Permit zone letter must match the street's zone.",
      "Plate on permit must match plate on car.",
      "P&D rules still active on Pay & Display streets.",
    ],
    carCount: 8,
    streets: ["High Road", "Market Street", "Abbey Close", "Victoria Terrace"],
    rent: 40,
  },
  {
    day: 3,
    briefing:
      "Council added Church Lane to your patrol — DOUBLE YELLOWS. No parking, except Blue Badge holders who may park up to 3 hours with their badge AND time clock displayed. All previous rules still apply.",
    newRuleSummary: [
      "Double yellows: PCN unless Blue Badge with clock displayed.",
      "Blue Badge holder must not exceed 3 hours from clock-set time.",
      "Permit + P&D rules still active.",
    ],
    carCount: 10,
    streets: [
      "High Road",
      "Market Street",
      "Abbey Close",
      "Victoria Terrace",
      "Church Lane",
    ],
    rent: 55,
  },
];

export function getDay(n: number): DayDef {
  return DAYS[n - 1] ?? DAYS[DAYS.length - 1];
}
