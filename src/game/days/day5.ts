import type { DayDef } from "../types";

export const day5: DayDef = {
  day: 5,
  briefing:
    "Word travels. The drivers you ticketed yesterday have made up their minds about you. Some have left fresh notes on their dashboards. They will not change the regulations.",
  newRuleSummary: [
    "All Day 1–4 rules remain in force.",
    "Recurring residents may reference yesterday's decisions in their notes.",
    "Supervisor review continues — sample of 3, £5 per error.",
  ],
  carCount: 12,
  streets: ["highRoad", "marketSt", "abbeyClose", "victoriaTerr", "churchLane"],
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
};
