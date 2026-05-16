import { BASE_PALETTE } from "./palette";
import { spriteSvg } from "./pixelArt";
import iconGrids from "../../data/sprites/icons.json";

const ICONS: Record<string, string> = iconGrids as Record<string, string>;

function render(key: string, className: string): string {
  return spriteSvg(ICONS[key] ?? "", BASE_PALETTE, { className });
}

export function lamppost(): string {
  return render("lamppost", "spr lamppost");
}

export function ticketMachine(): string {
  return render("ticketMachine", "spr ticket-machine");
}

export function zoneSign(zone: string): string {
  return `<div class="zone-sign">${render("zoneSign", "spr zone-sign-svg")}<span class="zone-sign-label">ZONE&nbsp;${zone}</span></div>`;
}

export function loadingSign(): string {
  return `<div class="zone-sign loading-sign">${render("loadingSign", "spr zone-sign-svg")}<span class="zone-sign-label">LOADING</span></div>`;
}

export function stampTick(): string {
  return render("stampTick", "spr stamp");
}

export function stampX(): string {
  return render("stampX", "spr stamp");
}

export function arrowRight(): string {
  return render("arrowRight", "spr arrow");
}
