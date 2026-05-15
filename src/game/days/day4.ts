import type { DayDef } from "../types";

export const day4: DayDef = {
  day: 4,
  briefing:
    "The Borough has assigned you a fixed beat. You'll start to recognise faces — and you'll be expected to enforce the rules without fear or favour. Inspector Harding is stepping up the spot checks: three decisions sampled, £5 a piece for any error.",
  newRuleSummary: [
    "All Day 1–3 rules remain in force.",
    "Some drivers may leave a note on the dashboard. Notes do not change the regulations.",
    "Supervisor review: 3 of your decisions will be sampled. £5 deducted per missed PCN or wrongful ticket.",
  ],
  carCount: 10,
  streets: ["highRoad", "marketSt", "abbeyClose", "victoriaTerr", "churchLane"],
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
};
