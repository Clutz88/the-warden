import type { Car } from "../game/types";

const COLOUR_HEX: Record<string, string> = {
  Red: "#a82c2c",
  Blue: "#2c4ea8",
  Black: "#222",
  Silver: "#bcc1c4",
  White: "#e9e6df",
  Green: "#2c6e3a",
  Grey: "#5a5e63",
};

export function renderScene(car: Car | null): string {
  if (!car) {
    return `<div class="scene"><div class="kerb"></div></div>`;
  }
  const kerbCls = car.street.kind;
  return `
    <div class="scene">
      <div class="street-label">Now inspecting</div>
      <div class="street-name">${car.street.name}${
        car.street.zone ? ` — Zone ${car.street.zone}` : ""
      }</div>
      <div class="kerb ${kerbCls}">
        <div class="car" style="--col:${COLOUR_HEX[car.colour] ?? "#888"}">
          <div class="model-label">${car.colour} ${car.model}</div>
          <div class="windscreen"></div>
          <div class="plate">${car.plate}</div>
        </div>
      </div>
    </div>
  `;
}
