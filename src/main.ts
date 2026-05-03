import "./style.css";
import {
  getState,
  setState,
  resetGame,
  subscribe,
  persistState,
  loadState,
  hydrate,
} from "./game/state";
import { generateCars } from "./game/cars";
import { getDay, DAYS } from "./game/days";
import { reviewShift } from "./game/supervisor";
import type { PlayerAction, ShiftLog, ResidentEncounter } from "./game/types";
import { renderHud } from "./ui/hud";
import { renderScene } from "./ui/scene";
import { renderDocs } from "./ui/docs";
import { renderRulebook } from "./ui/rulebook";
import { renderActions } from "./ui/actions";
import {
  renderBriefing,
  renderSummary,
  renderSupervisor,
  renderGameComplete,
} from "./ui/briefing";
import { startMusic, setMuted, isMuted } from "./audio/music";

const SHIFT_START = 9 * 60;
const PER_CAR_MINUTES = 12;
const WAGE_CORRECT = 10;
const WAGE_WRONG = -8;
const HIGH_DAY_KEY = "warden:highDay";

function startDay(day: number): void {
  const def = getDay(day);
  const prev = getState();
  const cars = generateCars({
    day,
    count: def.carCount,
    shiftStart: SHIFT_START,
    seed: 1000 * day + Math.floor(Math.random() * 1000),
    residentHistory: prev.residentHistory,
  });
  setState({
    day,
    clock: SHIFT_START,
    cars,
    carIndex: 0,
    wages: 0,
    mistakes: 0,
    log: [],
    phase: "briefing",
    residentHistory: prev.residentHistory,
    supervisorReview: undefined,
  });
}

function startShift(): void {
  setState({ phase: "shift" });
}

function judge(action: PlayerAction): void {
  const s = getState();
  if (s.phase !== "shift") return;
  const car = s.cars[s.carIndex];
  if (!car) return;

  const truth = car.truth;
  let correct = false;
  if (action.kind === "pass") {
    correct = truth.length === 0;
  } else {
    correct = truth.length > 0 && truth.some((v) => v.code === action.code);
  }

  const log: ShiftLog = { car, truth, playerAction: action, correct };
  const wages = s.wages + (correct ? WAGE_CORRECT : WAGE_WRONG);
  const mistakes = s.mistakes + (correct ? 0 : 1);
  const carIndex = s.carIndex + 1;
  const clock = s.clock + PER_CAR_MINUTES;

  let residentHistory = s.residentHistory;
  if (car.residentId) {
    const entry: ResidentEncounter = { day: s.day, action, correct };
    const existing = residentHistory[car.residentId] ?? [];
    residentHistory = {
      ...residentHistory,
      [car.residentId]: [...existing, entry],
    };
  }

  flashFeedback(correct, truth, action);

  if (carIndex >= s.cars.length) {
    setState({
      log: [...s.log, log],
      wages,
      mistakes,
      carIndex,
      clock,
      phase: "summary",
      residentHistory,
    });
  } else {
    setState({
      log: [...s.log, log],
      wages,
      mistakes,
      carIndex,
      clock,
      residentHistory,
    });
  }
}

function flashFeedback(
  correct: boolean,
  truth: { code: string; label: string }[],
  action: PlayerAction,
): void {
  const el = document.createElement("div");
  el.className = `feedback ${correct ? "good" : "bad"}`;
  if (correct) {
    el.textContent = action.kind === "pass" ? "✓ Correct — clean car" : `✓ Correct — PCN ${action.code}`;
  } else {
    if (action.kind === "pass" && truth.length) {
      el.textContent = `✗ Missed PCN ${truth[0]!.code}: ${truth[0]!.label}`;
    } else if (action.kind === "pcn" && !truth.length) {
      el.textContent = `✗ Wrongful PCN — car was clean`;
    } else if (action.kind === "pcn") {
      el.textContent = `✗ Wrong code — actual: ${truth.map((t) => t.code).join(", ")}`;
    }
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

function advanceFromSummary(): void {
  const s = getState();
  if (s.phase !== "summary") return;
  const def = getDay(s.day);
  if (!def.supervisor) {
    nextDay();
    return;
  }
  const review = reviewShift(s.log, def.supervisor, Math.random);
  const wagesAfter = s.wages - review.penalty;
  setState({
    phase: "supervisor",
    wages: wagesAfter,
    supervisorReview: review,
  });
}

function nextDay(): void {
  const s = getState();
  if (s.day >= DAYS.length) {
    setState({ phase: "gameover" });
    return;
  }
  startDay(s.day + 1);
}

function continuePrevious(): void {
  const saved = loadState();
  if (saved) hydrate(saved);
}

function render(): void {
  const s = getState();
  const root = document.getElementById("app");
  if (!root) return;
  const car = s.phase === "shift" ? s.cars[s.carIndex] ?? null : null;

  root.innerHTML = [
    renderHud(s),
    renderScene(car),
    renderDocs(car),
    renderRulebook(s.day),
    renderActions(s.day, s.phase !== "shift"),
  ].join("");

  removeOverlays();

  if (s.phase === "briefing") {
    if (s.day > 1) persistState();
    const hasSave = s.day === 1 && loadState() !== null;
    document.body.insertAdjacentHTML("beforeend", renderBriefing(s.day, hasSave));
  }
  if (s.phase === "summary") {
    const def = getDay(s.day);
    const correct = s.log.filter((l) => l.correct).length;
    const wrong = s.log.length - correct;
    const passed = s.wages >= def.rent;
    if (passed) {
      persistHighDay(s.day);
      persistState();
    }
    document.body.insertAdjacentHTML(
      "beforeend",
      renderSummary({
        day: s.day,
        correct,
        wrong,
        wages: s.wages,
        rent: def.rent,
        passed,
        hasSupervisor: !!def.supervisor,
      }),
    );
  }
  if (s.phase === "supervisor") {
    const def = getDay(s.day);
    const review = s.supervisorReview;
    if (!def.supervisor || !review) {
      nextDay();
      return;
    }
    document.body.insertAdjacentHTML(
      "beforeend",
      renderSupervisor({
        day: s.day,
        rent: def.rent,
        wagesAfter: s.wages,
        review,
      }),
    );
  }
  if (s.phase === "gameover") {
    document.body.insertAdjacentHTML("beforeend", renderGameComplete());
  }
}

function removeOverlays(): void {
  document.querySelectorAll(".modal-bg").forEach((n) => n.remove());
}

function persistHighDay(day: number): void {
  try {
    const prev = Number(localStorage.getItem(HIGH_DAY_KEY) ?? "0");
    if (day > prev) localStorage.setItem(HIGH_DAY_KEY, String(day));
  } catch {}
}

function bindGlobalEvents(): void {
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const action = t.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "toggle-mute") {
      startMusic();
      setMuted(!isMuted());
      render();
      return;
    }
    if (action === "start-shift") {
      startMusic();
      return startShift();
    }
    if (action === "next-day") return nextDay();
    if (action === "advance-from-summary") return advanceFromSummary();
    if (action === "continue") return continuePrevious();
    if (action === "restart") {
      resetGame();
      startDay(1);
      return;
    }
    if (action === "pass") return judge({ kind: "pass" });
    if (action === "pcn") {
      const code = t.closest<HTMLElement>("[data-action='pcn']")?.dataset.code;
      if (code) judge({ kind: "pcn", code });
    }
  });

  document.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "m" || e.key === "M") {
      startMusic();
      setMuted(!isMuted());
      render();
      return;
    }
    if (s.phase !== "shift") {
      if (e.key === "Enter") {
        if (s.phase === "briefing") {
          startMusic();
          startShift();
        }
        else if (s.phase === "summary") {
          const def = getDay(s.day);
          if (s.wages >= def.rent) advanceFromSummary();
        } else if (s.phase === "supervisor") {
          const def = getDay(s.day);
          if (s.wages >= def.rent) nextDay();
        }
      }
      return;
    }
    if (e.key === "p" || e.key === "P") return judge({ kind: "pass" });
    const codes = activePcnCodes(s.day);
    const idx = Number(e.key) - 1;
    if (!Number.isNaN(idx) && idx >= 0 && idx < codes.length) {
      judge({ kind: "pcn", code: codes[idx] });
    }
  });
}

function activePcnCodes(day: number): string[] {
  const out: string[] = [];
  if (day >= 1) out.push("01");
  if (day >= 2) out.push("12");
  if (day >= 3) out.push("40");
  return out;
}

declare global {
  interface Window { __wardenBound?: boolean }
}

subscribe(render);
if (!window.__wardenBound) {
  bindGlobalEvents();
  window.__wardenBound = true;
}
startDay(1);
