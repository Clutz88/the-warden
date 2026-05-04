const STATS_KEY = "warden:stats";

export type CareerStats = {
  daysPlayed: number;
  totalCorrect: number;
  totalWrong: number;
  totalWages: number;
  highDay: number;
};

const ZERO: CareerStats = {
  daysPlayed: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalWages: 0,
  highDay: 0,
};

export function loadStats(): CareerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...ZERO };
    const parsed = JSON.parse(raw) as Partial<CareerStats>;
    return { ...ZERO, ...parsed };
  } catch {
    return { ...ZERO };
  }
}

function persist(stats: CareerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export type DayResult = {
  day: number;
  correct: number;
  wrong: number;
  wages: number;
};

export function recordDay(result: DayResult): CareerStats {
  const cur = loadStats();
  const next: CareerStats = {
    daysPlayed: cur.daysPlayed + 1,
    totalCorrect: cur.totalCorrect + result.correct,
    totalWrong: cur.totalWrong + result.wrong,
    totalWages: cur.totalWages + result.wages,
    highDay: Math.max(cur.highDay, result.day),
  };
  persist(next);
  return next;
}

export function hasStats(): boolean {
  return loadStats().daysPlayed > 0;
}
