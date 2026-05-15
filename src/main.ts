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
import { buildCars } from "./game/cars";
import { TUNING } from "./game/tuning";
import { activeRules } from "./game/rules";
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
  renderStatsModal,
  renderHelpModal,
} from "./ui/briefing";
import { startMusic, setMuted, isMuted } from "./audio/music";
import { playPass, playPcn, playMistake, playClick } from "./audio/sfx";
import { recordDay, loadStats, hasStats } from "./game/stats";
import { inject } from "@vercel/analytics";

inject({
  mode: import.meta.env.MODE === "production" ? "production" : "development",
});

const SHIFT_START = TUNING.shiftStart;
const WAGE_CORRECT = TUNING.wages.correct;
const WAGE_WRONG = TUNING.wages.wrong;
const FLAWLESS_BONUS = TUNING.wages.flawlessBonus;

function startDay(day: number): void {
  const def = getDay(day);
  const prev = getState();
  const cars = buildCars(def.cars, day, prev.residentHistory);
  setState({
    day,
    clock: cars[0]?.seenAt ?? SHIFT_START,
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
  let correct: boolean;
  if (action.kind === "pass") {
    correct = truth.length === 0;
  } else {
    correct = truth.length > 0 && truth.some((v) => v.code === action.code);
  }

  const log: ShiftLog = { car, truth, playerAction: action, correct };
  const wages = s.wages + (correct ? WAGE_CORRECT : WAGE_WRONG);
  const mistakes = s.mistakes + (correct ? 0 : 1);
  const carIndex = s.carIndex + 1;
  const clock = s.cars[carIndex]?.seenAt ?? car.seenAt;

  let residentHistory = s.residentHistory;
  if (car.residentId) {
    const entry: ResidentEncounter = { day: s.day, action, correct };
    const existing = residentHistory[car.residentId] ?? [];
    residentHistory = {
      ...residentHistory,
      [car.residentId]: [...existing, entry],
    };
  }

  if (correct) {
    if (action.kind === "pass") {
      playPass();
      flashStamp("pass");
    } else {
      playPcn();
      flashStamp("pcn");
    }
  } else {
    playMistake();
    flashStamp("miss");
  }
  flashFeedback(correct, truth, action);

  if (carIndex >= s.cars.length) {
    const flawless = mistakes === 0;
    const finalWages = flawless ? wages + FLAWLESS_BONUS : wages;
    setState({
      log: [...s.log, log],
      wages: finalWages,
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
    persistState();
  }
}

function flashStamp(kind: "pass" | "pcn" | "miss"): void {
  const el = document.createElement("div");
  el.className = `stamp-flash ${kind}`;
  el.textContent = kind === "pass" ? "PASS" : kind === "pcn" ? "PCN" : "✗";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

const REDUCED_MOTION = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function mountCountUps(root: ParentNode): void {
  const targets = root.querySelectorAll<HTMLElement>("[data-count-target]");
  if (!targets.length) return;
  const reduced = REDUCED_MOTION();
  targets.forEach((el) => {
    const target = Number(el.dataset.countTarget ?? "0");
    const prefix = el.dataset.countPrefix ?? "";
    if (reduced || !Number.isFinite(target)) {
      el.textContent = `${prefix}${target}`;
      return;
    }
    const duration = 600;
    const start = Date.now();
    const id = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${prefix}${Math.round(target * eased)}`;
      if (t >= 1) {
        el.textContent = `${prefix}${target}`;
        window.clearInterval(id);
      }
    }, 30);
  });
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
  const correct = s.log.filter((l) => l.correct).length;
  const wrong = s.log.length - correct;
  recordDay({ day: s.day, correct, wrong, wages: s.wages });
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
    const showStats = s.day === 1 && hasStats();
    document.body.insertAdjacentHTML(
      "beforeend",
      renderBriefing(s.day, hasSave, showStats),
    );
  }
  if (s.phase === "summary") {
    const def = getDay(s.day);
    const correct = s.log.filter((l) => l.correct).length;
    const wrong = s.log.length - correct;
    const passed = s.wages >= def.rent;
    if (passed) persistState();
    const total = correct + wrong;
    const bonus = wrong === 0 && total > 0 ? FLAWLESS_BONUS : 0;
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
        bonus,
      }),
    );
    mountCountUps(document.body);
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
    mountCountUps(document.body);
  }
  if (s.phase === "gameover") {
    document.body.insertAdjacentHTML("beforeend", renderGameComplete());
  }

  document.querySelectorAll(".tutorial-card").forEach((n) => n.remove());
  if (s.phase === "shift" && s.day === 1 && s.carIndex === 0) {
    document.body.insertAdjacentHTML("beforeend", renderTutorialCard());
  }

  focusTopModal();
}

function renderTutorialCard(): string {
  return `
    <div class="tutorial-card">
      <div class="tutorial-head">FIRST SHIFT — HOW TO READ A CAR</div>
      <ol>
        <li>Look at the <b>street markings</b> in the scene above.</li>
        <li>Read every <b>document</b> on the dashboard.</li>
        <li>Compare ticket times to the <b>shift clock</b> in the HUD.</li>
        <li>Press <span class="kbd">P</span> to PASS or <span class="kbd">1</span> to issue a PCN.</li>
      </ol>
      <div class="tutorial-foot">Press <span class="kbd">?</span> for the full key reference.</div>
    </div>
  `;
}

function removeOverlays(): void {
  // Only clear non-transient overlays. Help/stats overlays manage themselves.
  document
    .querySelectorAll(".modal-bg:not([data-overlay])")
    .forEach((n) => n.remove());
}

function showOverlay(kind: "help" | "stats"): void {
  // Replace any existing transient overlay so the same key doesn't stack them.
  closeTopOverlay();
  const html = kind === "help" ? renderHelpModal() : renderStatsModal(loadStats());
  document.body.insertAdjacentHTML("beforeend", html);
  focusTopModal();
}

function focusTopModal(): void {
  const modals = document.querySelectorAll<HTMLElement>(".modal-bg");
  if (!modals.length) return;
  const top = modals[modals.length - 1]!;
  if (top.contains(document.activeElement)) return;
  const first = top.querySelector<HTMLElement>(
    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  );
  first?.focus();
}

function trapFocusInTopModal(e: KeyboardEvent): void {
  if (e.key !== "Tab") return;
  const modals = document.querySelectorAll<HTMLElement>(".modal-bg");
  if (!modals.length) return;
  const top = modals[modals.length - 1]!;
  const focusables = Array.from(
    top.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
  if (!focusables.length) return;
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  const active = document.activeElement as HTMLElement | null;
  const insideModal = active && top.contains(active);
  if (e.shiftKey) {
    if (!insideModal || active === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (!insideModal || active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function closeTopOverlay(): boolean {
  const overlays = document.querySelectorAll<HTMLElement>(".modal-bg[data-overlay]");
  if (!overlays.length) return false;
  overlays[overlays.length - 1]!.remove();
  return true;
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
      playClick();
      return startShift();
    }
    if (action === "next-day") {
      playClick();
      return nextDay();
    }
    if (action === "advance-from-summary") {
      playClick();
      return advanceFromSummary();
    }
    if (action === "continue") {
      playClick();
      return continuePrevious();
    }
    if (action === "restart") {
      playClick();
      const s = getState();
      if (
        (s.phase === "summary" || s.phase === "supervisor") &&
        s.log.length > 0
      ) {
        const correct = s.log.filter((l) => l.correct).length;
        const wrong = s.log.length - correct;
        recordDay({ day: s.day, correct, wrong, wages: s.wages });
      }
      document.querySelectorAll(".modal-bg").forEach((n) => n.remove());
      resetGame();
      startDay(1);
      return;
    }
    if (action === "pass") return judge({ kind: "pass" });
    if (action === "pcn") {
      const code = t.closest<HTMLElement>("[data-action='pcn']")?.dataset.code;
      if (code) judge({ kind: "pcn", code });
      return;
    }
    if (action === "show-help") {
      playClick();
      showOverlay("help");
      return;
    }
    if (action === "show-stats") {
      playClick();
      showOverlay("stats");
      return;
    }
    if (action === "close-overlay") {
      playClick();
      closeTopOverlay();
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    trapFocusInTopModal(e);
    if (e.defaultPrevented) return;
    const s = getState();
    if (e.key === "Escape") {
      if (closeTopOverlay()) {
        e.preventDefault();
        return;
      }
    }
    if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      showOverlay("help");
      e.preventDefault();
      return;
    }
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
  return activeRules(day).map((r) => r.code);
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
