import type { Car } from "../game/types";
import { renderCarSprite } from "./sprites/car";
import { renderKerbSprite } from "./sprites/kerb";

export function renderScene(car: Car | null): string {
  if (!car) {
    return `<div class="scene"><div class="kerb-scene empty"></div></div>`;
  }
  const carHtml = `
    <div class="car-rig">
      <div class="model-label">${car.colour} ${car.model}</div>
      ${renderCarSprite(car)}
      <div class="plate">${car.plate}</div>
    </div>
  `;
  return `
    <div class="scene">
      <div class="street-label">Now inspecting</div>
      <div class="street-name">${car.street.name}${
        car.street.zone ? ` — Zone ${car.street.zone}` : ""
      }</div>
      ${renderKerbSprite(car.street, carHtml)}
    </div>
  `;
}
