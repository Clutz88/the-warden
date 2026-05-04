import { activeRules } from "../game/rules";
import { stampTick, stampX } from "./sprites/icons";

export function renderActions(day: number, disabled: boolean): string {
  const rules = activeRules(day);

  return `
    <div class="actions">
      <button class="btn pass" data-action="pass" ${disabled ? "disabled" : ""}>
        <span class="btn-icon">${stampTick()}</span>
        PASS <span class="kbd">P</span>
      </button>
      <div class="pcn-picker">
        ${rules
          .map(
            (r, i) => `
              <button class="btn pcn" data-action="pcn" data-code="${r.code}" ${disabled ? "disabled" : ""}>
                <span class="btn-icon">${stampX()}</span>
                PCN ${r.code} — ${r.label} <span class="kbd">${i + 1}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}
