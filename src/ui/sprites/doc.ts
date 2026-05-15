import type { Doc } from "../../game/types";
import { BASE_PALETTE } from "./palette";
import { spriteSvg } from "./pixelArt";
import docGrids from "../../data/sprites/doc.json";

const DOC_GRIDS: Record<string, string> = docGrids as Record<string, string>;

export function renderCrest(): string {
  return spriteSvg(DOC_GRIDS.crest ?? "", BASE_PALETTE, { className: "spr crest" });
}

export function renderApprovedStamp(): string {
  return spriteSvg(DOC_GRIDS.stamp ?? "", BASE_PALETTE, { className: "spr doc-stamp" });
}

function fmtClock(m: number): string {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function paperWrap(klass: string, inner: string): string {
  return `
    <div class="doc ${klass}">
      <div class="doc-perf top"></div>
      <div class="doc-body">${inner}</div>
      <div class="doc-perf bottom"></div>
    </div>
  `;
}

export function renderDocPaper(d: Doc): string {
  if (d.type === "pd") {
    const inner = `
      <div class="doc-head">
        <div class="doc-crest">${renderCrest()}</div>
        <div class="doc-title">PAY &amp; DISPLAY</div>
      </div>
      <div class="doc-stamp-mark">${renderApprovedStamp()}</div>
      <div class="row"><span>Council:</span><b>BOROUGH OF ASHBRIDGE</b></div>
      <div class="row"><span>Expires:</span><b>${fmtClock(d.expiresAt)}</b></div>
    `;
    return paperWrap("pd", inner);
  }
  if (d.type === "permit") {
    const inner = `
      <div class="doc-head">
        <div class="doc-crest">${renderCrest()}</div>
        <div class="doc-title">RESIDENT PERMIT</div>
      </div>
      <div class="row"><span>Zone:</span><b>${d.zone ?? "—"}</b></div>
      <div class="row"><span>Plate:</span><b>${d.plate}</b></div>
      <div class="row"><span>Valid until:</span><b>${d.validUntil}</b></div>
    `;
    return paperWrap("permit", inner);
  }
  if (d.type === "note") {
    const inner = `
      <div class="doc-head">
        <div class="doc-title">NOTE FROM DRIVER</div>
      </div>
      <div class="note-from">${d.from}</div>
      <div class="note-text">${d.text}</div>
    `;
    return paperWrap("note", inner);
  }
  if (d.type === "loading-slip") {
    const inner = `
      <div class="doc-head">
        <div class="doc-crest">${renderCrest()}</div>
        <div class="doc-title">LOADING SLIP</div>
      </div>
      <div class="doc-stamp-mark">${renderApprovedStamp()}</div>
      <div class="row"><span>Firm:</span><b>${d.firm}</b></div>
      <div class="row"><span>Arrived:</span><b>${fmtClock(d.arrivedAt)}</b></div>
    `;
    return paperWrap("loading-slip", inner);
  }
  if (d.type === "blue-badge") {
    const inner = `
      <div class="doc-head">
        <div class="doc-crest">${renderCrest()}</div>
        <div class="doc-title">BLUE BADGE</div>
      </div>
      <div class="row"><span>Holder:</span><b>${d.holder}</b></div>
      <div class="row"><span>Valid until:</span><b>${d.validUntil}</b></div>
      <div class="row"><span>Clock displayed:</span><b>${d.clockShown ? "YES" : "NO"}</b></div>
      <div class="row"><span>Clock set at:</span><b>${
        d.clockSetAt != null ? fmtClock(d.clockSetAt) : "—"
      }</b></div>
    `;
    return paperWrap("blue-badge", inner);
  }
  return "";
}
