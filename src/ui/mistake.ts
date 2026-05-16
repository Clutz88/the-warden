import type { ShiftLog } from "../game/types";
import { residentById } from "../game/residents";

export function renderMistake(log: ShiftLog, isLastCar: boolean): string {
  const verdict = verdictText(log);
  const decision = log.playerAction.kind === "pass" ? "PASS" : `PCN ${log.playerAction.code}`;
  const resident = log.car.residentId ? residentById(log.car.residentId) : null;
  const driverRow = resident
    ? `<div class="row"><span>Driver:</span><b>${resident.name}</b></div>`
    : "";
  const advanceLabel = isLastCar ? "FINISH SHIFT" : "NEXT VEHICLE";
  return `
    <div class="modal-bg">
      <div class="modal mistake">
        <h1>MISTAKE</h1>
        <div class="row"><span>Vehicle:</span><b>${log.car.plate}</b></div>
        ${driverRow}
        <div class="row"><span>Your call:</span><b>${decision}</b></div>
        <div class="verdict bad">${verdict}</div>
        <button class="btn" data-action="ack-mistake">${advanceLabel} <span class="kbd">Enter</span></button>
      </div>
    </div>
  `;
}

function verdictText(l: ShiftLog): string {
  if (l.playerAction.kind === "pass" && l.truth.length) {
    return `Missed PCN ${l.truth[0]!.code} — ${l.truth[0]!.label}.`;
  }
  if (l.playerAction.kind === "pcn" && !l.truth.length) {
    return `Wrongful PCN — vehicle was clean.`;
  }
  const used = l.playerAction.kind === "pcn" ? l.playerAction.code : "—";
  return `Wrong code (you used ${used}, actual ${l.truth.map((t) => t.code).join(", ")}).`;
}
