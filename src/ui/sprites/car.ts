import type { Car } from "../../game/types";
import { COLOUR_HEX, carPalette } from "./palette";
import { spriteSvg } from "./pixelArt";
import carGrids from "../../data/sprites/cars.json";

const GRIDS: Record<string, string> = carGrids as Record<string, string>;
const FALLBACK_KEY = "Ford Fiesta";

export function renderCarSprite(car: Car): string {
  const grid = GRIDS[car.model] ?? GRIDS[FALLBACK_KEY] ?? "";
  const bodyHex = COLOUR_HEX[car.colour] ?? "#888";
  const palette = carPalette(bodyHex);
  return spriteSvg(grid, palette, { className: "car-svg" });
}

export function renderPlate(plate: string): string {
  return `<span class="plate-text">${plate}</span>`;
}
