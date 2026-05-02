import type { Palette } from "./palette";

export type SpriteResult = { rects: string; w: number; h: number };

export function pixelArt(grid: string, palette: Palette): SpriteResult {
  const rows = grid.replace(/^\n+/, "").replace(/\n+$/, "").split("\n");
  const h = rows.length;
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    let runStart = -1;
    let runChar = ".";
    for (let x = 0; x <= w; x++) {
      const c = row[x] ?? ".";
      if (c !== runChar) {
        if (runChar !== "." && runStart >= 0) {
          const fill = palette[runChar];
          if (fill) {
            out.push(
              `<rect x="${runStart}" y="${y}" width="${x - runStart}" height="1" fill="${fill}"/>`,
            );
          }
        }
        runStart = x;
        runChar = c;
      }
    }
  }
  return { rects: out.join(""), w, h };
}

export type SvgOpts = {
  className?: string;
  style?: string;
  pad?: number;
};

export function spriteSvg(grid: string, palette: Palette, opts: SvgOpts = {}): string {
  const { rects, w, h } = pixelArt(grid, palette);
  const cls = opts.className ?? "";
  const style = opts.style ?? "";
  return `<svg class="${cls}" style="${style}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}
