import { getDay } from "../game/days";

export function renderBriefing(day: number): string {
  const d = getDay(day);
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
};

export function renderSummary(a: SummaryArgs): string {
  const net = a.wages - a.rent;
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
        ${
          a.passed
            ? `<button class="btn" data-action="next-day">NEXT DAY</button>`
            : `<p style="color:var(--bad);margin-top:14px;">You couldn't make rent. The council has terminated your contract.</p>
               <button class="btn" data-action="restart">RESTART</button>`
        }
      </div>
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
