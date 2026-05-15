import paletteData from "../../data/sprites/palette.json";

export type Palette = Record<string, string>;

export const COLOUR_HEX: Record<string, string> = paletteData.carColours as Record<string, string>;

export const BASE_PALETTE: Palette = paletteData.base as Palette;

export function darken(hex: string, amt = 40): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function carPalette(bodyHex: string): Palette {
  return {
    ...BASE_PALETTE,
    B: bodyHex,
    D: darken(bodyHex, 50),
    d: darken(bodyHex, 80),
  };
}
