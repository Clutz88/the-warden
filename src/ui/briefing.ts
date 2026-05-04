import { getDay } from "../game/days";
import type { ShiftLog, StoredSupervisorReview } from "../game/types";
import { residentById } from "../game/residents";
import type { CareerStats } from "../game/stats";

export function renderBriefing(
  day: number,
  hasSave: boolean,
  showStats: boolean,
): string {
  const d = getDay(day);
  const continueBtn =
    day === 1 && hasSave
      ? `<button class="btn" data-action="continue">CONTINUE PREVIOUS</button>`
      : "";
  const statsBtn =
    day === 1 && showStats
      ? `<button class="btn" data-action="show-stats">CAREER STATS</button>`
      : "";
  return `
    <div class="modal-bg">
      <div class="modal">
        <h1>DAY ${day} — BRIEFING</h1>
        <p>${d.briefing}</p>
        <h3>Today's checklist</h3>
        <ul>${d.newRuleSummary.map((s) => `<li>${s}</li>`).join("")}</ul>
        <h3>Streets on patrol</h3>
        <ul>${d.streets.map((s) => `<li>${s}</li>`).join("")}</ul>
        <h3>Quota</h3>
        <p>${d.carCount} vehicles. Make rent of £${d.rent} or you're out.</p>
        ${continueBtn}
        <button class="btn" data-action="start-shift">START SHIFT</button>
        ${statsBtn}
      </div>
    </div>
  `;
}

export type SummaryArgs = {
  day: number;
  correct: number;
  wrong: number;
  wages: number;
  rent: number;
  passed: boolean;
  hasSupervisor: boolean;
  bonus: number;
};

export function renderSummary(a: SummaryArgs): string {
  const net = a.wages - a.rent;
  const advance = a.passed
    ? a.hasSupervisor
      ? `<button class="btn" data-action="advance-from-summary">SUPERVISOR REVIEW</button>`
      : `<button class="btn" data-action="next-day">NEXT DAY</button>`
    : `<p style="color:var(--bad);margin-top:14px;">You couldn't make rent. The council has terminated your contract.</p>
       <button class="btn" data-action="restart">RESTART</button>`;
  const total = a.correct + a.wrong;
  const quip = a.passed ? shiftQuip(a.wrong, total) : null;
  const quipHtml = quip
    ? `<p style="font-style:italic;color:#5a3a17;margin:10px 0 4px;">${quip}</p>`
    : "";
  const bonusRow =
    a.bonus > 0
      ? `<div class="row"><span>Flawless shift bonus:</span>${countCell(a.bonus, "£", "var(--good)")}</div>`
      : "";
  return `
    <div class="modal-bg">
      <div class="modal">
        <h1>DAY ${a.day} — SHIFT END</h1>
        <div class="row"><span>Correct decisions:</span>${countCell(a.correct)}</div>
        <div class="row"><span>Mistakes:</span>${countCell(a.wrong)}</div>
        <div class="row"><span>Wages earned:</span>${countCell(a.wages, "£")}</div>
        ${bonusRow}
        <div class="row"><span>Rent / costs:</span>${countCell(a.rent, "£")}</div>
        <div class="row"><span><b>Net:</b></span>${countCell(net, "£", net >= 0 ? "var(--good)" : "var(--bad)")}</div>
        ${quipHtml}
        ${advance}
      </div>
    </div>
  `;
}

function shiftQuip(wrong: number, total: number): string {
  if (total === 0) return "A quiet shift on the streets of Ashbridge.";
  if (wrong === 0) return "Immaculate. Not a single misstep.";
  if (wrong === 1) return "Strong shift. One slip is forgivable.";
  if (wrong <= 3) return "Solid work, but the Borough notices the rough edges.";
  if (wrong <= total / 2) return "Half-hearted enforcement. The wardens' union won't save you.";
  return "Word will reach Inspector Harding before sundown.";
}

function countCell(target: number, prefix = "", color?: string): string {
  const style = color ? ` style="color:${color}"` : "";
  return `<b class="count" data-count-target="${target}" data-count-prefix="${prefix}"${style}>${prefix}0</b>`;
}

export type SupervisorArgs = {
  day: number;
  rent: number;
  wagesAfter: number;
  review: StoredSupervisorReview;
};

export function renderSupervisor(a: SupervisorArgs): string {
  const cases = a.review.sample.map(renderCase).join("");
  const passed = a.wagesAfter >= a.rent;
  const advance = passed
    ? `<button class="btn" data-action="next-day">NEXT DAY</button>`
    : `<p style="color:var(--bad);margin-top:14px;">After deductions you couldn't make rent. The council has terminated your contract.</p>
       <button class="btn" data-action="restart">RESTART</button>`;
  const net = a.wagesAfter - a.rent;
  return `
    <div class="modal-bg">
      <div class="modal supervisor">
        <h1>DAY ${a.day} — SUPERVISOR REVIEW</h1>
        <p><b>Inspector Harding</b> reviewed ${a.review.sample.length} of your decisions.</p>
        <p style="font-style:italic;color:#5a3a17;">${supervisorQuip(a.review.wrongInSample, a.review.sample.length)}</p>
        ${cases}
        <div class="penalty">
          <div class="row"><span>Mistakes flagged:</span>${countCell(a.review.wrongInSample)}</div>
          <div class="row"><span>Penalty:</span>${countCell(a.review.penalty, "£")}</div>
          <div class="row"><span>Wages after penalty:</span>${countCell(a.wagesAfter, "£")}</div>
          <div class="row"><span>Rent:</span>${countCell(a.rent, "£")}</div>
          <div class="row"><span><b>Net:</b></span>${countCell(net, "£", net >= 0 ? "var(--good)" : "var(--bad)")}</div>
        </div>
        ${advance}
      </div>
    </div>
  `;
}

function supervisorQuip(wrong: number, sampleSize: number): string {
  if (sampleSize === 0) return `"A quiet day. Don't get used to it."`;
  if (wrong === 0) return `"Spotless. Council likes that."`;
  if (wrong === 1) return `"One slip. We've all had worse mornings."`;
  if (wrong === 2) return `"Two errors out of ${sampleSize}. Tighten up."`;
  if (wrong >= sampleSize) return `"Every single one. We need to talk."`;
  return `"${wrong} mistakes in a sample of ${sampleSize}. The Borough is watching."`;
}

function renderCase(l: ShiftLog): string {
  const resident = l.car.residentId ? residentById(l.car.residentId) : null;
  const verdictGood = l.correct;
  const verdictText = verdictGood
    ? "Decision upheld."
    : l.playerAction.kind === "pass" && l.truth.length
    ? `Missed PCN ${l.truth[0]!.code} — ${l.truth[0]!.label}.`
    : l.playerAction.kind === "pcn" && !l.truth.length
    ? `Wrongful PCN — vehicle was clean.`
    : `Wrong code (you used ${
        l.playerAction.kind === "pcn" ? l.playerAction.code : "—"
      }, actual ${l.truth.map((t) => t.code).join(", ")}).`;
  const decision =
    l.playerAction.kind === "pass" ? "PASS" : `PCN ${l.playerAction.code}`;
  const driver = resident
    ? `<div class="row"><span>Driver:</span><b>${resident.name}</b></div>
       <div class="row"><span>Note:</span><b>${resident.bio}</b></div>`
    : "";
  return `
    <div class="case ${verdictGood ? "good" : "bad"}">
      <div class="row"><span>Vehicle:</span><b>${l.car.plate}</b></div>
      ${driver}
      <div class="row"><span>Your call:</span><b>${decision}</b></div>
      <div class="verdict ${verdictGood ? "good" : "bad"}">${verdictText}</div>
    </div>
  `;
}

export function renderGameComplete(): string {
  return `
    <div class="modal-bg">
      <div class="modal">
        <h1>END OF ROTATION</h1>
        <p>You held the line for six shifts on the streets of Ashbridge. Inspector Harding will recommend you for a permanent posting — assuming the regulations don't change again.</p>
        <button class="btn" data-action="restart">PLAY AGAIN</button>
        <button class="btn" data-action="show-stats">CAREER STATS</button>
      </div>
    </div>
  `;
}

export function renderStatsModal(stats: CareerStats): string {
  const accuracy =
    stats.totalCorrect + stats.totalWrong === 0
      ? 0
      : Math.round(
          (stats.totalCorrect / (stats.totalCorrect + stats.totalWrong)) * 100,
        );
  return `
    <div class="modal-bg" data-overlay="stats">
      <div class="modal">
        <h1>CAREER RECORD</h1>
        <div class="row"><span>Days served:</span><b>${stats.daysPlayed}</b></div>
        <div class="row"><span>Highest day reached:</span><b>${stats.highDay}</b></div>
        <div class="row"><span>Decisions correct:</span><b>${stats.totalCorrect}</b></div>
        <div class="row"><span>Mistakes:</span><b>${stats.totalWrong}</b></div>
        <div class="row"><span>Accuracy:</span><b>${accuracy}%</b></div>
        <div class="row"><span>Lifetime wages:</span><b>£${stats.totalWages}</b></div>
        <button class="btn" data-action="close-overlay">CLOSE <span class="kbd">Esc</span></button>
      </div>
    </div>
  `;
}

export function renderHelpModal(): string {
  return `
    <div class="modal-bg" data-overlay="help">
      <div class="modal">
        <h1>KEYBOARD &amp; CONTROLS</h1>
        <div class="row"><span>PASS the car:</span><b>P</b></div>
        <div class="row"><span>Issue PCN (left to right):</span><b>1 / 2 / 3 / 4</b></div>
        <div class="row"><span>Advance briefing / summary:</span><b>Enter</b></div>
        <div class="row"><span>Toggle music + SFX:</span><b>M</b></div>
        <div class="row"><span>This help:</span><b>?</b></div>
        <div class="row"><span>Close any overlay:</span><b>Esc</b></div>
        <h3>Tips</h3>
        <ul>
          <li>Compare every doc against the shift clock in the HUD.</li>
          <li>Permits must match BOTH the street's zone AND the car's plate.</li>
          <li>Driver notes never change the regulations — they're flavour, not evidence.</li>
        </ul>
        <button class="btn" data-action="close-overlay">CLOSE <span class="kbd">Esc</span></button>
      </div>
    </div>
  `;
}
