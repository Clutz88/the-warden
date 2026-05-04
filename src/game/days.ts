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
      "Council added Church Lane to your patrol — DOUBLE YELLOWS. No parking, except Blue Badge holders who may park up to 3 hours with their badge AND time clock displayed. All previous rules still apply. Inspector Harding will pull ONE of your decisions for a courtesy review at end of shift — light penalty, but a warning shot.",
    newRuleSummary: [
      "Double yellows: PCN unless Blue Badge with clock displayed.",
      "Blue Badge holder must not exceed 3 hours from clock-set time.",
      "Permit + P&D rules still active.",
      "Trial supervisor review: 1 decision sampled, £2 if it's wrong.",
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
    supervisor: { sampleSize: 1, penaltyPerWrong: 2 },
  },
  {
    day: 4,
    briefing:
      "The Borough has assigned you a fixed beat. You'll start to recognise faces — and you'll be expected to enforce the rules without fear or favour. Inspector Harding is stepping up the spot checks: three decisions sampled, £5 a piece for any error.",
    newRuleSummary: [
      "All Day 1–3 rules remain in force.",
      "Some drivers may leave a note on the dashboard. Notes do not change the regulations.",
      "Supervisor review: 3 of your decisions will be sampled. £5 deducted per missed PCN or wrongful ticket.",
    ],
    carCount: 10,
    streets: [
      "High Road",
      "Market Street",
      "Abbey Close",
      "Victoria Terrace",
      "Church Lane",
    ],
    rent: 60,
    residentChance: 0.35,
    residentPool: [
      "margaret-dawes",
      "bernard-holland",
      "derek-foster",
      "priya-shah",
      "elsie-whittaker",
      "owen-pritchard",
      "fatima-rahman",
      "jaime-okafor",
      "stuart-mclean",
      "tomasz-kowalski",
      "agnes-bellweather",
    ],
    supervisor: { sampleSize: 3, penaltyPerWrong: 5 },
  },
  {
    day: 5,
    briefing:
      "Word travels. The drivers you ticketed yesterday have made up their minds about you. Some have left fresh notes on their dashboards. They will not change the regulations.",
    newRuleSummary: [
      "All Day 1–4 rules remain in force.",
      "Recurring residents may reference yesterday's decisions in their notes.",
      "Supervisor review continues — sample of 3, £5 per error.",
    ],
    carCount: 12,
    streets: [
      "High Road",
      "Market Street",
      "Abbey Close",
      "Victoria Terrace",
      "Church Lane",
    ],
    rent: 75,
    residentChance: 0.45,
    residentPool: [
      "margaret-dawes",
      "bernard-holland",
      "derek-foster",
      "priya-shah",
      "elsie-whittaker",
      "owen-pritchard",
      "fatima-rahman",
      "jaime-okafor",
      "stuart-mclean",
      "tomasz-kowalski",
      "agnes-bellweather",
    ],
    supervisor: { sampleSize: 3, penaltyPerWrong: 5 },
  },
  {
    day: 6,
    briefing:
      "New beat: Bishop's Way loading bay. Delivery vehicles only — drivers must show a loading slip and may not overstay 30 minutes from the arrival time on the slip. No slip, or a slip more than 30 minutes old, means PCN 25.",
    newRuleSummary: [
      "Loading bay: PCN 25 unless a loading slip is on the dashboard.",
      "Slip's ARRIVED time must be within the last 30 minutes (vs your shift clock).",
      "All Day 1–5 rules remain in force.",
    ],
    carCount: 12,
    streets: [
      "High Road",
      "Market Street",
      "Abbey Close",
      "Victoria Terrace",
      "Church Lane",
      "Bishop's Way",
    ],
    rent: 90,
    residentChance: 0.4,
    residentPool: [
      "margaret-dawes",
      "bernard-holland",
      "derek-foster",
      "priya-shah",
      "elsie-whittaker",
      "owen-pritchard",
      "fatima-rahman",
      "jaime-okafor",
      "stuart-mclean",
      "tomasz-kowalski",
      "agnes-bellweather",
    ],
    supervisor: { sampleSize: 4, penaltyPerWrong: 6 },
  },
];

export function getDay(n: number): DayDef {
  return DAYS[n - 1] ?? DAYS[DAYS.length - 1];
}
