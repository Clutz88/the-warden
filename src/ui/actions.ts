import { PCN_CODES, activeRules } from "../game/rules";
import { stampTick, stampX } from "./sprites/icons";

const CODE_ORDER = ["01", "12", "25", "40"];

export function renderActions(day: number, disabled: boolean): string {
  const activeCodes = activeRules(day).map((r) => {
    if (r.id === "pd-required") return "01";
    if (r.id === "permit-zone-match") return "12";
    if (r.id === "double-yellow") return "40";
    return null;
  }).filter(Boolean) as string[];

  const visibleCodes = CODE_ORDER.filter((c) => activeCodes.includes(c));

  return `
    <div class="actions">
      <button class="btn pass" data-action="pass" ${disabled ? "disabled" : ""}>
        <span class="btn-icon">${stampTick()}</span>
        PASS <span class="kbd">P</span>
      </button>
      <div class="pcn-picker">
        ${visibleCodes
          .map(
            (c, i) => `
              <button class="btn pcn" data-action="pcn" data-code="${c}" ${disabled ? "disabled" : ""}>
                <span class="btn-icon">${stampX()}</span>
                PCN ${c} — ${PCN_CODES[c]} <span class="kbd">${i + 1}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}
