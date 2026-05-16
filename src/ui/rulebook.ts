import { getDay, DAYS } from "../game/days";
import { RULES } from "../game/rules";

export function renderRulebook(day: number): string {
  const cumulative = DAYS.slice(0, day);
  const rules = cumulative.flatMap((d) => d.newRuleSummary.map((s) => ({ day: d.day, s })));
  const today = getDay(day);
  return `
    <div class="rulebook">
      <h2>Regulations — Day ${day}</h2>
      <div class="briefing">${today.briefing}</div>
      <ul>
        ${rules.map((r) => `<li><b>D${r.day}:</b> ${r.s}</li>`).join("")}
      </ul>
      <h2 style="margin-top:14px;">PCN Codes</h2>
      <ul>
        ${RULES.map((r) => `<li><b>${r.code}</b> — ${r.label}</li>`).join("")}
      </ul>
    </div>
  `;
}
