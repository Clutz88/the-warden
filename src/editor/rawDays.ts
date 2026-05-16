import type { DayDefRaw } from "../game/types";

const RAW_MODULES = import.meta.glob<{ default: DayDefRaw }>("../data/days/day*.json", {
  eager: true,
});

function discover(): { numbers: number[]; map: Record<number, DayDefRaw> } {
  const map: Record<number, DayDefRaw> = {};
  const numbers: number[] = [];
  for (const [path, mod] of Object.entries(RAW_MODULES)) {
    const m = /day(\d+)\.json$/.exec(path);
    if (!m) continue;
    const day = Number(m[1]);
    map[day] = mod.default;
    numbers.push(day);
  }
  numbers.sort((a, b) => a - b);
  return { numbers, map };
}

const discovered = discover();

export const DAY_NUMBERS: number[] = discovered.numbers;
export const RAW_DAYS: Record<number, DayDefRaw> = discovered.map;

export function nextDayNumber(): number {
  return DAY_NUMBERS.length === 0 ? 1 : DAY_NUMBERS[DAY_NUMBERS.length - 1]! + 1;
}

export function emptyDayRaw(day: number): DayDefRaw {
  return {
    day,
    briefing: "New day briefing.",
    newRuleSummary: [],
    streets: ["highRoad"],
    rent: 30,
    cars: [],
  };
}
