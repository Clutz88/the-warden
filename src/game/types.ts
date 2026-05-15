export type ZoneCode = "A" | "B" | "C" | null;

export type StreetKind =
  | "pay-and-display"
  | "permit"
  | "double-yellow"
  | "single-yellow"
  | "loading-bay";

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

export type DocNote = {
  type: "note";
  from: string;
  text: string;
};

export type DocLoadingSlip = {
  type: "loading-slip";
  firm: string;
  arrivedAt: number;
};

export type ToneCode = "positive" | "negative" | "neutral";

export type DocReactiveNote = {
  type: "reactive-note";
  from: string;
  variants: Partial<Record<ToneCode, string>>;
};

export type Doc =
  | DocPayDisplay
  | DocPermit
  | DocBlueBadge
  | DocNote
  | DocLoadingSlip
  | DocReactiveNote;

export type Violation = { code: string; label: string };

export type Car = {
  id: string;
  plate: string;
  colour: string;
  model: string;
  street: Street;
  docs: Doc[];
  truth: Violation[];
  seenAt: number;
  residentId?: string;
};

export type CarSpec = {
  seenAt: number;
  plate: string;
  colour: string;
  model: string;
  street: string;
  docs: Doc[];
  residentId?: string;
};

export type DocRaw =
  | { type: "pd"; zone: ZoneCode; expiresAt: string }
  | { type: "permit"; zone: ZoneCode; plate: string; validUntil: string }
  | {
      type: "blue-badge";
      holder: string;
      validUntil: string;
      clockShown: boolean;
      clockSetAt: string | null;
    }
  | { type: "note"; from: string; text: string }
  | { type: "loading-slip"; firm: string; arrivedAt: string }
  | DocReactiveNote;

export type CarSpecRaw = {
  seenAt: string;
  plate: string;
  colour: string;
  model: string;
  street: string;
  docs: DocRaw[];
  residentId?: string;
};

export type RuleCtx = {
  car: Car;
  clock: number;
};

export type Rule = {
  id: string;
  code: string;
  label: string;
  firstDay: number;
  check: (ctx: RuleCtx) => boolean;
};

export type SupervisorConfig = {
  sampleSize: number;
  penaltyPerWrong: number;
};

export type DayDef = {
  day: number;
  briefing: string;
  newRuleSummary: string[];
  cars: CarSpec[];
  streets: string[];
  rent: number;
  supervisor?: SupervisorConfig;
};

export type DayDefRaw = {
  day: number;
  briefing: string;
  newRuleSummary: string[];
  cars: CarSpecRaw[];
  streets: string[];
  rent: number;
  supervisor?: SupervisorConfig;
};

export type TuningRaw = {
  shiftStart: string;
  wages: { correct: number; wrong: number; flawlessBonus: number };
};

export type Tuning = {
  shiftStart: number;
  wages: { correct: number; wrong: number; flawlessBonus: number };
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

export type ResidentEncounter = {
  day: number;
  action: PlayerAction;
  correct: boolean;
};

export type StoredSupervisorReview = {
  sample: ShiftLog[];
  wrongInSample: number;
  penalty: number;
};

export type GameState = {
  day: number;
  clock: number;
  cars: Car[];
  carIndex: number;
  wages: number;
  mistakes: number;
  log: ShiftLog[];
  phase: "briefing" | "shift" | "summary" | "supervisor" | "gameover";
  residentHistory: Record<string, ResidentEncounter[]>;
  supervisorReview?: StoredSupervisorReview;
};
