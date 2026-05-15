import type { DayDef } from "../types";

export const day6: DayDef = {
  day: 6,
  briefing:
    "New beat: Bishop's Way loading bay. Delivery vehicles only — drivers must show a loading slip and may not overstay 30 minutes from the arrival time on the slip. No slip, or a slip more than 30 minutes old, means PCN 25.",
  newRuleSummary: [
    "Loading bay: PCN 25 unless a loading slip is on the dashboard.",
    "Slip's ARRIVED time must be within the last 30 minutes (vs your shift clock).",
    "All Day 1–5 rules remain in force.",
  ],
  carCount: 12,
  streets: ["highRoad", "marketSt", "abbeyClose", "victoriaTerr", "churchLane", "bishopsWay"],
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
};
