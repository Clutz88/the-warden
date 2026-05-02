import type { Car } from "../game/types";
import { renderDocPaper } from "./sprites/doc";

export function renderDocs(car: Car | null): string {
  if (!car) return `<div class="docs"><h2>Documents</h2></div>`;
  const body = car.docs.length
    ? car.docs.map(renderDocPaper).join("")
    : `<div class="doc empty">No documents on dashboard.</div>`;
  return `<div class="docs"><h2>Documents on dashboard</h2>${body}</div>`;
}
