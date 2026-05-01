import type { Car, Doc } from "../game/types";

function fmtClock(m: number): string {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function renderDoc(d: Doc): string {
  if (d.type === "pd") {
    return `
      <div class="doc pd">
        <div class="doc-title">Pay & Display Ticket</div>
        <div class="row"><span>Council:</span><b>Borough of Ashbridge</b></div>
        <div class="row"><span>Expires:</span><b>${fmtClock(d.expiresAt)}</b></div>
      </div>
    `;
  }
  if (d.type === "permit") {
    return `
      <div class="doc permit">
        <div class="doc-title">Resident Permit</div>
        <div class="row"><span>Zone:</span><b>${d.zone}</b></div>
        <div class="row"><span>Plate:</span><b>${d.plate}</b></div>
        <div class="row"><span>Valid until:</span><b>${d.validUntil}</b></div>
      </div>
    `;
  }
  if (d.type === "blue-badge") {
    return `
      <div class="doc blue-badge">
        <div class="doc-title">Blue Badge</div>
        <div class="row"><span>Holder:</span><b>${d.holder}</b></div>
        <div class="row"><span>Valid until:</span><b>${d.validUntil}</b></div>
        <div class="row"><span>Clock displayed:</span><b>${d.clockShown ? "YES" : "NO"}</b></div>
        <div class="row"><span>Clock set at:</span><b>${
          d.clockSetAt != null ? fmtClock(d.clockSetAt) : "—"
        }</b></div>
      </div>
    `;
  }
  return "";
}

export function renderDocs(car: Car | null): string {
  if (!car) return `<div class="docs"><h2>Documents</h2></div>`;
  const body = car.docs.length
    ? car.docs.map(renderDoc).join("")
    : `<div class="doc empty">No documents on dashboard.</div>`;
  return `<div class="docs"><h2>Documents on dashboard</h2>${body}</div>`;
}
