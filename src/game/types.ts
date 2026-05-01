export type ZoneCode = "A" | "B" | "C" | null;

export type StreetKind = "pay-and-display" | "permit" | "double-yellow" | "single-yellow";

export type Street = {
  id: string;
  name: string;
  kind: StreetKind;
  zone: ZoneCode;
};

export type DocPayDisplay = {
  type: "pd";
  zone: ZoneCode;
  expiresAt: number;
};

export type DocPermit = {
  type: "permit";
  zone: ZoneCode;
  plate: string;
  validUntil: string;
};

export type DocBlueBadge = {
  type: "blue-badge";
  holder: string;
  validUntil: string;
  clockShown: boolean;
  clockSetAt: number | null;
};

export type Doc = DocPayDisplay | DocPermit | DocBlueBadge;

export type Violation = { code: string; label: string };

export type Car = {
  id: string;
  plate: string;
  colour: string;
  model: string;
  street: Street;
  docs: Doc[];
  truth: Violation[];
};

export type RuleCtx = {
  car: Car;
  clock: number;
};

export type Rule = {
  id: string;
  firstDay: number;
  check: (ctx: RuleCtx) => Violation | null;
};

export type DayDef = {
  day: number;
  briefing: string;
  newRuleSummary: string[];
  carCount: number;
  streets: string[];
  rent: number;
};

export type ShiftLog = {
  car: Car;
  truth: Violation[];
  playerAction: PlayerAction;
  correct: boolean;
};

export type PlayerAction =
  | { kind: "pass" }
  | { kind: "pcn"; code: string };

export type GameState = {
  day: number;
  clock: number;
  cars: Car[];
  carIndex: number;
  wages: number;
  mistakes: number;
  log: ShiftLog[];
  phase: "briefing" | "shift" | "summary" | "gameover";
};
