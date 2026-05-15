import type { DayDef } from "../types";

export const day3: DayDef = {
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
  streets: ["highRoad", "marketSt", "abbeyClose", "victoriaTerr", "churchLane"],
  rent: 55,
  supervisor: { sampleSize: 1, penaltyPerWrong: 2 },
};
