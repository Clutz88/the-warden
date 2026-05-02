export const COLOUR_HEX: Record<string, string> = {
  Red: "#a8412c",
  Blue: "#2c4a78",
  Black: "#1f1f1f",
  Silver: "#a8aab0",
  White: "#d4cdb3",
  Green: "#3a6b3e",
  Grey: "#56595e",
};

export function darken(hex: string, amt = 40): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export type Palette = Record<string, string>;

export const BASE_PALETTE: Palette = {
  O: "#0a0a0a",
  W: "#aac8d8",
  w: "#d6e6ed",
  T: "#141414",
  H: "#3a3a3a",
  L: "#f5e89a",
  R: "#c43838",
  P: "#e8c84a",
  p: "#1a1a1a",
  M: "#2c2c2c",
  S: "#dadbd1",
  G: "#0e0e0e",
  r: "#1a1a1a",
  Y: "#caa84a",
  y: "#e6c468",
  K: "#3b3e36",
  k: "#2b2e28",
  N: "#7c7f74",
  n: "#5a5d54",
  J: "#8a3a2c",
  j: "#5a261c",
  E: "#d8d4c0",
  e: "#9a9684",
  F: "#caa84a",
  f: "#a08a3a",
  X: "#d6cfa8",
  x: "#a8a07a",
};

export function carPalette(bodyHex: string): Palette {
  return {
    ...BASE_PALETTE,
    B: bodyHex,
    D: darken(bodyHex, 50),
    d: darken(bodyHex, 80),
  };
}
