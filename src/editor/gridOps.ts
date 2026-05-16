// Pure operations on sprite grid strings. Each row is a line; rows are joined by "\n".
// Empty / "." cells are transparent.

export function paintGridCell(grid: string, x: number, y: number, ch: string): string {
  if (ch.length !== 1) throw new Error(`paintGridCell: ch must be exactly 1 char, got "${ch}"`);
  const rows = grid.split("\n");
  if (y < 0 || y >= rows.length) return grid;
  const row = rows[y]!;
  if (x < 0 || x >= row.length) return grid;
  rows[y] = row.slice(0, x) + ch + row.slice(x + 1);
  return rows.join("\n");
}

export function resizeGridString(grid: string, deltaW: number, deltaH: number): string {
  let rows = grid.split("\n");
  if (deltaH > 0) {
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    for (let i = 0; i < deltaH; i++) rows.push(".".repeat(w));
  } else if (deltaH < 0) {
    rows = rows.slice(0, Math.max(1, rows.length + deltaH));
  }
  if (deltaW > 0) {
    rows = rows.map((r) => r + ".".repeat(deltaW));
  } else if (deltaW < 0) {
    rows = rows.map((r) => r.slice(0, Math.max(1, r.length + deltaW)));
  }
  return rows.join("\n");
}

export function gridDimensions(grid: string): { w: number; h: number } {
  const rows = grid.split("\n");
  return {
    h: rows.length,
    w: rows.reduce((m, r) => Math.max(m, r.length), 0),
  };
}
