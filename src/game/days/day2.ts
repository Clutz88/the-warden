import type { DayDef } from "../types";

export const day2: DayDef = {
  day: 2,
  briefing:
    "New zones added to your patrol: Abbey Close (Zone A) and Victoria Terrace (Zone B). Residents must show a permit matching the zone of the street, AND the registration on the permit must match the car's plate. P&D rules still apply on the high streets.",
  newRuleSummary: [
    "Permit zone letter must match the street's zone.",
    "Plate on permit must match plate on car.",
    "P&D rules still active on Pay & Display streets.",
  ],
  carCount: 8,
  streets: ["highRoad", "marketSt", "abbeyClose", "victoriaTerr"],
  rent: 40,
};
