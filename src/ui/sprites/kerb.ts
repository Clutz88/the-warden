import type { Street } from "../../game/types";
import { lamppost, ticketMachine, zoneSign } from "./icons";

export function renderKerbSprite(street: Street, carHtml: string): string {
  const kind = street.kind;
  const pavementDecor: string[] = [];
  pavementDecor.push(`<div class="lamp-mount">${lamppost()}</div>`);

  if (kind === "pay-and-display") {
    pavementDecor.push(`<div class="machine-mount">${ticketMachine()}</div>`);
  } else if (kind === "permit" && street.zone) {
    pavementDecor.push(`<div class="sign-mount">${zoneSign(street.zone)}</div>`);
  }

  return `
    <div class="kerb-scene ${kind}">
      <div class="kerb-pavement">${pavementDecor.join("")}</div>
      <div class="kerb-curb"></div>
      <div class="kerb-road">
        <div class="kerb-markings"></div>
        <div class="car-slot">${carHtml}</div>
      </div>
    </div>
  `;
}
