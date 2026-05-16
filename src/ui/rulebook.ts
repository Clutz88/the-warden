import { getDay, DAYS } from "../game/days";
import { activeRules } from "../game/rules";

export function renderRulebook(day: number): string {
  const cumulative = DAYS.slice(0, day);
  const rules = cumulative.flatMap((d) => d.newRuleSummary);
  const today = getDay(day);
  const active = activeRules(day);
  return `
    <div class="rulebook">
      <h2>Regulations — Day ${day}</h2>
      <div class="briefing">${today.briefing}</div>
      <ul>
        ${rules.map((s) => `<li>${s}</li>`).join("")}
      </ul>
      <h2 style="margin-top:14px;">PCN Codes</h2>
      <ul>
        ${active.map((r) => `<li><b>${r.code}</b> — ${r.label}</li>`).join("")}
      </ul>
    </div>
  `;
}
