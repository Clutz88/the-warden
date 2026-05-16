import { lamppost, ticketMachine, zoneSign } from "./sprites/icons";
import { spriteSvg } from "./sprites/pixelArt";
import { carPalette, COLOUR_HEX } from "./sprites/palette";
import carGrids from "../data/sprites/cars.json";

const CAR_GRIDS = carGrids as Record<string, string>;

function carArt(model: string, colour: string): string {
  const grid = CAR_GRIDS[model] ?? "";
  const hex = COLOUR_HEX[colour] ?? "#888";
  return spriteSvg(grid, carPalette(hex), { className: "car-svg" });
}

function renderMenuArt(): string {
  return `
    <div class="mainmenu-art" aria-hidden="true">
      <div class="kerb-scene pay-and-display menu">
        <div class="kerb-pavement">
          <div class="lamp-mount">${lamppost()}</div>
          <div class="machine-mount">${ticketMachine()}</div>
          <div class="sign-mount menu-zone">${zoneSign("A")}</div>
        </div>
        <div class="kerb-curb"></div>
        <div class="kerb-road">
          <div class="kerb-markings"></div>
          <div class="menu-cars">
            <div class="menu-car">${carArt("Mini Cooper", "Red")}</div>
            <div class="menu-car">${carArt("Ford Fiesta", "Blue")}</div>
            <div class="menu-car">${carArt("VW Golf", "White")}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderMainMenu(hasSave: boolean, hasStats: boolean): string {
  const continueBtn = hasSave
    ? `<button class="btn" data-action="continue">CONTINUE</button>`
    : `<button class="btn" disabled title="No saved shift yet">CONTINUE</button>`;
  const statsBtn = hasStats
    ? `<button class="btn" data-action="show-stats">CAREER STATS</button>`
    : `<button class="btn" disabled title="No career stats yet">CAREER STATS</button>`;
  return `
    <div class="mainmenu-page">
      ${renderMenuArt()}
      <div class="mainmenu-panel">
        <h1>THE WARDEN</h1>
        <p class="subtitle">Borough of Ashbridge — Parking Enforcement</p>
        <div class="mainmenu-buttons">
          ${continueBtn}
          <button class="btn" data-action="start-new">NEW SHIFT</button>
          ${statsBtn}
          <button class="btn" data-action="show-help">CONTROLS &amp; HELP</button>
        </div>
        <p class="mainmenu-footer">Press <span class="kbd">Enter</span> to begin.</p>
      </div>
    </div>
  `;
}
