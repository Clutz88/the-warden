import { getDay } from "../game/days";
import type { ShiftLog, StoredSupervisorReview } from "../game/types";
import { residentById } from "../game/residents";

export function renderBriefing(day: number, hasSave: boolean): string {
  const d = getDay(day);
  const continueBtn =
    day === 1 && hasSave
      ? `<button class="btn" data-action="continue">CONTINUE PREVIOUS</button>`
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
};

export function renderSummary(a: SummaryArgs): string {
  const net = a.wages - a.rent;
  const advance = a.passed
    ? a.hasSupervisor
      ? `<button class="btn" data-action="advance-from-summary">SUPERVISOR REVIEW</button>`
      : `<button class="btn" data-action="next-day">NEXT DAY</button>`
    : `<p style="color:var(--bad);margin-top:14px;">You couldn't make rent. The council has terminated your contract.</p>
       <button class="btn" data-action="restart">RESTART</button>`;
  return `
    <div class="modal-bg">
      <div class="modal">
        <h1>DAY ${a.day} — SHIFT END</h1>
        <div class="row"><span>Correct decisions:</span><b>${a.correct}</b></div>
        <div class="row"><span>Mistakes:</span><b>${a.wrong}</b></div>
        <div class="row"><span>Wages earned:</span><b>£${a.wages}</b></div>
        <div class="row"><span>Rent / costs:</span><b>£${a.rent}</b></div>
        <div class="row"><span><b>Net:</b></span><b style="color:${
          net >= 0 ? "var(--good)" : "var(--bad)"
        }">£${net}</b></div>
        ${advance}
      </div>
    </div>
  `;
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
        <p>The council inspector has reviewed ${a.review.sample.length} of your decisions.</p>
        ${cases}
        <div class="penalty">
          <div class="row"><span>Mistakes flagged:</span><b>${a.review.wrongInSample}</b></div>
          <div class="row"><span>Penalty:</span><b>£${a.review.penalty}</b></div>
          <div class="row"><span>Wages after penalty:</span><b>£${a.wagesAfter}</b></div>
          <div class="row"><span>Rent:</span><b>£${a.rent}</b></div>
          <div class="row"><span><b>Net:</b></span><b style="color:${
            net >= 0 ? "var(--good)" : "var(--bad)"
          }">£${net}</b></div>
        </div>
        ${advance}
      </div>
    </div>
  `;
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
        <h1>VERTICAL SLICE COMPLETE</h1>
        <p>You survived three shifts on the streets of Ashbridge. The council awaits further legislation. (More days coming soon.)</p>
        <button class="btn" data-action="restart">PLAY AGAIN</button>
      </div>
    </div>
  `;
}
