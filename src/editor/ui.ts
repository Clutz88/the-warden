import type { CarSpecRaw, DocRaw, ToneCode, ZoneCode } from "../game/types";
import { STREETS } from "../game/streets";
import {
  getState,
  setState,
  switchDay,
  switchMode,
  updateCar,
  updateDraft,
  updateResident,
  updateResidents,
} from "./state";
import { DAY_NUMBERS, RAW_DAYS, emptyDayRaw, nextDayNumber } from "./rawDays";
import { previewDraft, type DraftPreview } from "./preview";
import { saveDay, saveResidents } from "./save";

const STREET_KEYS = Object.keys(STREETS);
const DOC_TYPES: DocRaw["type"][] = [
  "pd",
  "permit",
  "blue-badge",
  "loading-slip",
  "note",
  "reactive-note",
];
const TONES: ToneCode[] = ["neutral", "positive", "negative"];
const ZONES: ZoneCode[] = [null, "A", "B", "C"];

export function render(root: HTMLElement): void {
  const s = getState();
  if (s.mode === "residents") {
    root.replaceChildren(buildResidentsPage());
  } else {
    const preview = previewDraft(s.draft);
    root.replaceChildren(buildDayPage(preview));
  }
}

function buildDayPage(preview: DraftPreview): HTMLElement {
  const wrap = el("div", { id: "editor-root" });
  wrap.appendChild(buildHeader());
  const body = el("div", { class: "editor-body" });
  body.appendChild(buildLeftColumn(preview));
  body.appendChild(buildRightColumn(preview));
  wrap.appendChild(body);
  return wrap;
}

function buildResidentsPage(): HTMLElement {
  const wrap = el("div", { id: "editor-root" });
  wrap.appendChild(buildHeader());
  const body = el("div", { class: "editor-body" });
  body.appendChild(buildResidentsLeft());
  body.appendChild(buildResidentsRight());
  wrap.appendChild(body);
  return wrap;
}

function buildHeader(): HTMLElement {
  const s = getState();
  const header = el("header", { class: "editor-header" });
  header.appendChild(
    el("h1", {}, s.mode === "residents" ? "THE WARDEN — RESIDENTS" : "THE WARDEN — DAY EDITOR"),
  );

  const modeToggle = el("div", { class: "mode-toggle" });
  for (const m of ["day", "residents"] as const) {
    const b = el("button", { class: s.mode === m ? "primary" : "" }, m === "day" ? "Days" : "Residents");
    b.addEventListener("click", () => {
      if (m === s.mode) return;
      const otherDirty = m === "day" ? s.residentsDirty : s.dirty;
      if (otherDirty && !window.confirm("Unsaved changes will be lost. Switch mode anyway?")) return;
      switchMode(m);
    });
    modeToggle.appendChild(b);
  }
  header.appendChild(modeToggle);

  if (s.mode === "day") {
    const daySel = el("select", { "aria-label": "Day", style: "width: auto" }) as HTMLSelectElement;
    for (const d of DAY_NUMBERS) {
      const opt = el("option", { value: String(d) }, `Day ${d}`) as HTMLOptionElement;
      if (d === s.day) opt.selected = true;
      daySel.appendChild(opt);
    }
    daySel.addEventListener("change", () => {
      const targetDay = Number(daySel.value);
      if (targetDay === s.day) return;
      if (s.dirty && !window.confirm("Unsaved changes will be lost. Switch day anyway?")) {
        daySel.value = String(s.day);
        return;
      }
      const raw = RAW_DAYS[targetDay];
      if (raw) switchDay(targetDay, raw);
    });
    header.appendChild(daySel);

    const newDayBtn = el("button", { title: "Create a new day file" }, "+ New day");
    newDayBtn.addEventListener("click", onCreateDay);
    header.appendChild(newDayBtn);

    header.appendChild(
      el("span", { class: "muted small" }, `${s.draft.cars.length} cars`),
    );
  } else {
    const newResidentBtn = el("button", { title: "Add a new resident" }, "+ New resident");
    newResidentBtn.addEventListener("click", onAddResident);
    header.appendChild(newResidentBtn);
    header.appendChild(
      el("span", { class: "muted small" }, `${s.residentsDraft.length} residents`),
    );
  }

  header.appendChild(el("div", { class: "spacer" }));

  const status = el("span", {
    class: `status ${statusClass(s.saveStatus.kind)}`,
  }, statusText(s.saveStatus));
  header.appendChild(status);

  const openGame = el("a", { href: "/", target: "_blank", class: "muted small" }, "Open game ↗");
  header.appendChild(openGame);

  const saveBtn = el("button", { class: "primary" }, "Save") as HTMLButtonElement;
  if (s.saveStatus.kind === "saving") saveBtn.disabled = true;
  saveBtn.addEventListener("click", onSave);
  header.appendChild(saveBtn);

  return header;
}

function statusClass(k: string): string {
  if (k === "ok") return "ok";
  if (k === "err") return "err";
  return "";
}
function statusText(s: ReturnType<typeof getState>["saveStatus"]): string {
  if (s.kind === "idle") {
    const st = getState();
    const dirty = st.mode === "residents" ? st.residentsDirty : st.dirty;
    return dirty ? "● unsaved changes" : "saved";
  }
  if (s.kind === "saving") return "saving…";
  if (s.kind === "ok") return `saved ${s.message ?? ""}`;
  return `error: ${s.message ?? ""}`;
}

async function onSave(): Promise<void> {
  const s = getState();
  setState({ saveStatus: { kind: "saving" } });
  if (s.mode === "residents") {
    const res = await saveResidents(s.residentsDraft);
    if (res.ok) {
      setState({ residentsDirty: false, saveStatus: { kind: "ok", message: res.file } });
    } else {
      setState({ saveStatus: { kind: "err", message: res.error } });
    }
  } else {
    const res = await saveDay(s.day, s.draft);
    if (res.ok) {
      setState({ dirty: false, saveStatus: { kind: "ok", message: res.file } });
    } else {
      setState({ saveStatus: { kind: "err", message: res.error } });
    }
  }
}

async function onCreateDay(): Promise<void> {
  const s = getState();
  if (s.dirty && !window.confirm("Unsaved changes will be lost. Continue creating a new day?")) return;
  const day = nextDayNumber();
  if (!window.confirm(`Create Day ${day}? An empty day${day}.json will be written to src/game/days/.`)) return;
  setState({ saveStatus: { kind: "saving" } });
  const res = await saveDay(day, emptyDayRaw(day));
  if (!res.ok) {
    setState({ saveStatus: { kind: "err", message: res.error } });
    return;
  }
  sessionStorage.setItem("editor:day", String(day));
  sessionStorage.setItem("editor:carIdx", "0");
  // Reload so import.meta.glob picks up the new file
  window.location.reload();
}

function buildLeftColumn(preview: DraftPreview): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildDayMeta());
  col.appendChild(buildCarsTable(preview));
  const s = getState();
  const idx = s.selectedCarIdx;
  if (idx >= 0 && idx < s.draft.cars.length) {
    col.appendChild(buildCarDetail(idx, preview));
  }
  return col;
}

function buildRightColumn(preview: DraftPreview): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildTruthPanel(preview));
  return col;
}

// --- Day metadata ---

function buildDayMeta(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Day Settings"));

  const briefing = el("textarea", { rows: "3" }) as HTMLTextAreaElement;
  briefing.value = s.draft.briefing;
  briefing.addEventListener("input", () => updateDraft((d) => { d.briefing = briefing.value; }));
  card.appendChild(labeled("Briefing", briefing));

  card.appendChild(el("h3", {}, "Rule summary (one per line)"));
  const rules = el("textarea", { rows: "4" }) as HTMLTextAreaElement;
  rules.value = s.draft.newRuleSummary.join("\n");
  rules.addEventListener("input", () => updateDraft((d) => {
    d.newRuleSummary = rules.value.split("\n").map((x) => x.trim()).filter(Boolean);
  }));
  card.appendChild(rules);

  const rent = el("input", { type: "number", min: "0" }) as HTMLInputElement;
  rent.value = String(s.draft.rent);
  rent.addEventListener("input", () => updateDraft((d) => { d.rent = Number(rent.value) || 0; }));
  const rentWrap = el("div", { style: "max-width: 160px" });
  rentWrap.appendChild(labeled("Rent (£)", rent));
  card.appendChild(rentWrap);

  card.appendChild(el("h3", {}, "Streets on patrol"));
  const list = el("div", { class: "checkbox-list" });
  for (const key of STREET_KEYS) {
    const lab = el("label");
    const cb = el("input", { type: "checkbox" }) as HTMLInputElement;
    cb.checked = s.draft.streets.includes(key);
    cb.addEventListener("change", () => updateDraft((d) => {
      const set = new Set(d.streets);
      if (cb.checked) set.add(key); else set.delete(key);
      d.streets = STREET_KEYS.filter((k) => set.has(k));
    }));
    lab.appendChild(cb);
    const name = STREETS[key]?.name ?? key;
    lab.appendChild(el("span", { class: "small" }, `${name} (${key})`));
    list.appendChild(lab);
  }
  card.appendChild(list);
  return card;
}

// --- Cars table ---

function buildCarsTable(preview: DraftPreview): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  const head = el("div", { class: "row", style: "justify-content: space-between" });
  head.appendChild(el("h2", { style: "margin: 0" }, `Cars (${s.draft.cars.length})`));
  const addBtn = el("button", {}, "+ Add car");
  addBtn.addEventListener("click", onAddCar);
  head.appendChild(addBtn);
  card.appendChild(head);

  const table = el("table", { class: "cars" });
  const thead = el("thead");
  const trH = el("tr");
  ["#", "Seen", "Plate", "Street", "Docs", "Truth", ""].forEach((h) => trH.appendChild(el("th", {}, h)));
  thead.appendChild(trH);
  table.appendChild(thead);

  const tbody = el("tbody");
  s.draft.cars.forEach((car, i) => {
    const tr = el("tr", { class: i === s.selectedCarIdx ? "selected" : "" });
    tr.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) return;
      setState({ selectedCarIdx: i });
    });
    tr.appendChild(el("td", {}, String(i + 1)));
    tr.appendChild(el("td", {}, car.seenAt));
    tr.appendChild(el("td", {}, car.plate));
    tr.appendChild(el("td", {}, STREETS[car.street]?.name ?? car.street));
    tr.appendChild(el("td", {}, car.docs.map((d) => d.type).join(", ") || "—"));

    const truthCell = el("td");
    const t = preview.perCar[i];
    if (!t) {
      truthCell.textContent = "—";
    } else if (t.kind === "error") {
      truthCell.innerHTML = `<span class="codes err">!</span>`;
    } else if (t.codes.length === 0) {
      truthCell.innerHTML = `<span class="codes pass">PASS</span>`;
    } else {
      truthCell.innerHTML = `<span class="codes pcn">${t.codes.join(",")}</span>`;
    }
    tr.appendChild(truthCell);

    const actions = el("td");
    actions.appendChild(iconBtn("▲", () => moveCar(i, -1), i === 0));
    actions.appendChild(iconBtn("▼", () => moveCar(i, 1), i === s.draft.cars.length - 1));
    const del = el("button", { class: "danger" }, "✕");
    del.addEventListener("click", () => onDeleteCar(i));
    actions.appendChild(del);
    tr.appendChild(actions);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  return card;
}

function iconBtn(label: string, onClick: () => void, disabled: boolean): HTMLButtonElement {
  const b = el("button", {}, label) as HTMLButtonElement;
  b.disabled = disabled;
  b.addEventListener("click", onClick);
  return b;
}

function onAddCar(): void {
  const s = getState();
  const last = s.draft.cars[s.draft.cars.length - 1];
  const seenAt = last ? bumpClock(last.seenAt, 10) : "09:00";
  const street = s.draft.streets[0] ?? STREET_KEYS[0]!;
  const newCar: CarSpecRaw = {
    seenAt,
    plate: "AB12 CDE",
    colour: "Red",
    model: "Ford Fiesta",
    street,
    docs: [],
  };
  updateDraft((d) => { d.cars.push(newCar); });
  setState({ selectedCarIdx: getState().draft.cars.length - 1 });
}

function onDeleteCar(idx: number): void {
  if (!confirm(`Delete car ${idx + 1}?`)) return;
  updateDraft((d) => { d.cars.splice(idx, 1); });
  const s = getState();
  if (s.selectedCarIdx >= s.draft.cars.length) {
    setState({ selectedCarIdx: s.draft.cars.length - 1 });
  }
}

function moveCar(idx: number, delta: number): void {
  const target = idx + delta;
  updateDraft((d) => {
    if (target < 0 || target >= d.cars.length) return;
    const [moved] = d.cars.splice(idx, 1);
    if (moved) d.cars.splice(target, 0, moved);
  });
  setState({ selectedCarIdx: target });
}

function bumpClock(hhmm: string, minutes: number): string {
  const m = /^(\d\d):(\d\d)$/.exec(hhmm);
  if (!m) return hhmm;
  const total = Number(m[1]) * 60 + Number(m[2]) + minutes;
  const h = Math.floor(total / 60) % 24;
  const mi = total % 60;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

// --- Car detail ---

function buildCarDetail(idx: number, preview: DraftPreview): HTMLElement {
  const car = getState().draft.cars[idx]!;
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, `Car ${idx + 1} — ${car.plate}`));

  const t = preview.perCar[idx];
  if (t?.kind === "error") {
    const banner = el("div", { class: "banner err" }, t.message);
    card.appendChild(banner);
  }

  const grid = el("div", { class: "grid-4" });
  grid.appendChild(labeled("Seen at (HH:MM)", textInput(car.seenAt, (v) => updateCar(idx, (c) => { c.seenAt = v; }), !/^\d\d:\d\d$/.test(car.seenAt))));
  grid.appendChild(labeled("Plate", textInput(car.plate, (v) => updateCar(idx, (c) => { c.plate = v; }))));
  grid.appendChild(labeled("Colour", textInput(car.colour, (v) => updateCar(idx, (c) => { c.colour = v; }))));
  grid.appendChild(labeled("Model", textInput(car.model, (v) => updateCar(idx, (c) => { c.model = v; }))));
  card.appendChild(grid);

  const grid2 = el("div", { class: "grid-2" });
  grid2.appendChild(labeled("Street", selectInput(STREET_KEYS, car.street, (v) => updateCar(idx, (c) => { c.street = v; }))));
  const residentOpts = ["", ...getState().residentsDraft.map((r) => r.id)];
  grid2.appendChild(labeled("Resident (optional)", selectInput(residentOpts, car.residentId ?? "", (v) => updateCar(idx, (c) => {
    if (v) c.residentId = v; else delete c.residentId;
  }))));
  card.appendChild(grid2);

  card.appendChild(el("h3", {}, `Docs (${car.docs.length})`));
  const docsList = el("div", { class: "docs-list" });
  car.docs.forEach((d, di) => docsList.appendChild(buildDocRow(idx, di, d)));
  card.appendChild(docsList);

  const addDocRow = el("div", { class: "row", style: "margin-top: 10px" });
  const typeSel = el("select") as HTMLSelectElement;
  for (const t of DOC_TYPES) typeSel.appendChild(el("option", { value: t }, t));
  const addDoc = el("button", {}, "+ Add doc");
  addDoc.addEventListener("click", () => {
    updateCar(idx, (c) => { c.docs.push(defaultDoc(typeSel.value as DocRaw["type"], c)); });
  });
  addDocRow.appendChild(typeSel);
  addDocRow.appendChild(addDoc);
  card.appendChild(addDocRow);
  return card;
}

function buildDocRow(carIdx: number, docIdx: number, doc: DocRaw): HTMLElement {
  const row = el("div", { class: "doc-row" });
  const head = el("div", { class: "doc-head" });
  head.appendChild(el("span", { class: "doc-type" }, doc.type));
  const rm = el("button", { class: "danger" }, "Remove");
  rm.addEventListener("click", () => {
    updateCar(carIdx, (c) => { c.docs.splice(docIdx, 1); });
  });
  head.appendChild(rm);
  row.appendChild(head);
  row.appendChild(buildDocFields(carIdx, docIdx, doc));
  return row;
}

function buildDocFields(carIdx: number, docIdx: number, doc: DocRaw): HTMLElement {
  const replace = (patch: Partial<DocRaw>) => {
    updateCar(carIdx, (c) => {
      const cur = c.docs[docIdx];
      if (!cur) return;
      c.docs[docIdx] = { ...cur, ...patch } as DocRaw;
    });
  };
  switch (doc.type) {
    case "pd": {
      const g = el("div", { class: "grid-2" });
      g.appendChild(labeled("Zone", selectInput(ZONES.map(zoneLabel), zoneLabel(doc.zone), (v) => replace({ zone: parseZone(v) }))));
      g.appendChild(labeled("Expires at (HH:MM)", textInput(doc.expiresAt, (v) => replace({ expiresAt: v }), !/^\d\d:\d\d$/.test(doc.expiresAt))));
      return g;
    }
    case "permit": {
      const g = el("div", { class: "grid-3" });
      g.appendChild(labeled("Zone", selectInput(ZONES.map(zoneLabel), zoneLabel(doc.zone), (v) => replace({ zone: parseZone(v) }))));
      g.appendChild(labeled("Plate on permit", textInput(doc.plate, (v) => replace({ plate: v }))));
      g.appendChild(labeled("Valid until (DD/MM/YYYY)", textInput(doc.validUntil, (v) => replace({ validUntil: v }))));
      return g;
    }
    case "blue-badge": {
      const g = el("div", { class: "grid-4" });
      g.appendChild(labeled("Holder", textInput(doc.holder, (v) => replace({ holder: v }))));
      g.appendChild(labeled("Valid until", textInput(doc.validUntil, (v) => replace({ validUntil: v }))));
      g.appendChild(labeled("Clock shown", checkboxInput(doc.clockShown, (v) => replace({ clockShown: v }))));
      g.appendChild(labeled("Clock set at (HH:MM, blank for none)", textInput(doc.clockSetAt ?? "", (v) => replace({ clockSetAt: v ? v : null }))));
      return g;
    }
    case "loading-slip": {
      const g = el("div", { class: "grid-2" });
      g.appendChild(labeled("Firm", textInput(doc.firm, (v) => replace({ firm: v }))));
      g.appendChild(labeled("Arrived at (HH:MM)", textInput(doc.arrivedAt, (v) => replace({ arrivedAt: v }), !/^\d\d:\d\d$/.test(doc.arrivedAt))));
      return g;
    }
    case "note": {
      const g = el("div", { class: "grid-2" });
      g.appendChild(labeled("From", textInput(doc.from, (v) => replace({ from: v }))));
      const ta = el("textarea", { rows: "2" }) as HTMLTextAreaElement;
      ta.value = doc.text;
      ta.addEventListener("input", () => replace({ text: ta.value }));
      g.appendChild(labeled("Text", ta));
      return g;
    }
    case "reactive-note": {
      const wrap = el("div");
      wrap.appendChild(labeled("From", textInput(doc.from, (v) => replace({ from: v }))));
      const variants = { ...doc.variants };
      for (const tone of TONES) {
        const ta = el("textarea", { rows: "2" }) as HTMLTextAreaElement;
        ta.value = variants[tone] ?? "";
        ta.addEventListener("input", () => {
          const next = { ...variants };
          if (ta.value) next[tone] = ta.value;
          else delete next[tone];
          replace({ variants: next });
        });
        wrap.appendChild(labeled(`${tone} variant`, ta));
      }
      return wrap;
    }
    default:
      return el("div", {}, "(unknown doc type)");
  }
}

function defaultDoc(type: DocRaw["type"], car: CarSpecRaw): DocRaw {
  switch (type) {
    case "pd":
      return { type: "pd", zone: null, expiresAt: bumpClock(car.seenAt, 60) };
    case "permit":
      return { type: "permit", zone: "A", plate: car.plate, validUntil: "31/12/2026" };
    case "blue-badge":
      return { type: "blue-badge", holder: "HOLDER NAME", validUntil: "30/06/2027", clockShown: true, clockSetAt: car.seenAt };
    case "loading-slip":
      return { type: "loading-slip", firm: "PARCELFLEET LTD", arrivedAt: car.seenAt };
    case "note":
      return { type: "note", from: "", text: "" };
    case "reactive-note":
      return { type: "reactive-note", from: "", variants: { neutral: "" } };
  }
}

// --- Truth panel ---

function buildTruthPanel(preview: DraftPreview): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Live Truth"));

  if (preview.load.kind === "error") {
    card.appendChild(el("div", { class: "banner err" }, preview.load.message));
  } else {
    card.appendChild(el("div", { class: "banner ok" }, "Draft validates"));
  }

  const list = el("div", { class: "truth-list" });
  s.draft.cars.forEach((car, i) => {
    const row = el("div", { class: "truth-row" });
    const t = preview.perCar[i];
    row.appendChild(el("span", { class: "when" }, car.seenAt));
    row.appendChild(el("span", { class: "plate" }, car.plate));
    row.appendChild(el("span", { class: "muted" }, STREETS[car.street]?.name ?? car.street));
    let verdict: HTMLElement;
    if (!t || t.kind === "error") {
      verdict = el("span", { class: "codes err" }, "ERR");
    } else if (t.codes.length === 0) {
      verdict = el("span", { class: "codes pass" }, "PASS");
    } else {
      verdict = el("span", { class: "codes pcn" }, t.codes.map((c) => `PCN ${c}`).join(" "));
    }
    row.appendChild(verdict);
    list.appendChild(row);
  });
  card.appendChild(list);
  return card;
}

// --- Residents mode ---

function buildResidentsLeft(): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildResidentsList());
  const s = getState();
  const idx = s.selectedResidentIdx;
  if (idx >= 0 && idx < s.residentsDraft.length) {
    col.appendChild(buildResidentDetail(idx));
  }
  return col;
}

function buildResidentsRight(): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildResidentsValidation());
  return col;
}

function buildResidentsList(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  const head = el("div", { class: "row", style: "justify-content: space-between" });
  head.appendChild(el("h2", { style: "margin: 0" }, `Residents (${s.residentsDraft.length})`));
  const addBtn = el("button", {}, "+ Add resident");
  addBtn.addEventListener("click", onAddResident);
  head.appendChild(addBtn);
  card.appendChild(head);

  const table = el("table", { class: "cars" });
  const thead = el("thead");
  const trH = el("tr");
  ["#", "ID", "Name", "Plate", "Bio", ""].forEach((h) => trH.appendChild(el("th", {}, h)));
  thead.appendChild(trH);
  table.appendChild(thead);

  const tbody = el("tbody");
  s.residentsDraft.forEach((r, i) => {
    const tr = el("tr", { class: i === s.selectedResidentIdx ? "selected" : "" });
    tr.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) return;
      setState({ selectedResidentIdx: i });
    });
    tr.appendChild(el("td", {}, String(i + 1)));
    tr.appendChild(el("td", {}, r.id));
    tr.appendChild(el("td", {}, r.name));
    tr.appendChild(el("td", {}, r.plate));
    tr.appendChild(el("td", {}, r.bio.slice(0, 60) + (r.bio.length > 60 ? "…" : "")));
    const actions = el("td");
    const del = el("button", { class: "danger" }, "✕");
    del.addEventListener("click", () => onDeleteResident(i));
    actions.appendChild(del);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  return card;
}

function buildResidentDetail(idx: number): HTMLElement {
  const r = getState().residentsDraft[idx]!;
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, `Resident ${idx + 1} — ${r.name}`));

  const grid = el("div", { class: "grid-2" });
  grid.appendChild(labeled("ID (referenced from day JSON)", textInput(r.id, (v) => updateResident(idx, (x) => { x.id = v; }))));
  grid.appendChild(labeled("Name", textInput(r.name, (v) => updateResident(idx, (x) => { x.name = v; }))));
  grid.appendChild(labeled("Plate", textInput(r.plate, (v) => updateResident(idx, (x) => { x.plate = v; }))));
  grid.appendChild(labeled("Home street (free text, optional)", textInput(r.homeStreetId ?? "", (v) => updateResident(idx, (x) => {
    if (v) x.homeStreetId = v; else delete x.homeStreetId;
  }))));
  card.appendChild(grid);

  const bioTa = el("textarea", { rows: "3" }) as HTMLTextAreaElement;
  bioTa.value = r.bio;
  bioTa.addEventListener("input", () => updateResident(idx, (x) => { x.bio = bioTa.value; }));
  card.appendChild(labeled("Bio", bioTa));

  return card;
}

function buildResidentsValidation(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Validation"));

  const errors: string[] = [];
  const ids = new Set<string>();
  const plates = new Set<string>();
  for (const r of s.residentsDraft) {
    if (!r.id.trim()) errors.push(`Resident "${r.name || "(unnamed)"}" has empty id`);
    else if (ids.has(r.id)) errors.push(`Duplicate id: ${r.id}`);
    ids.add(r.id);
    if (!r.plate.trim()) errors.push(`Resident "${r.id}" has empty plate`);
    else if (plates.has(r.plate)) errors.push(`Duplicate plate: ${r.plate}`);
    plates.add(r.plate);
    if (!r.name.trim()) errors.push(`Resident "${r.id}" has empty name`);
  }

  if (errors.length === 0) {
    card.appendChild(el("div", { class: "banner ok" }, "All residents valid"));
  } else {
    for (const e of errors) card.appendChild(el("div", { class: "banner err" }, e));
  }
  return card;
}

function onAddResident(): void {
  const s = getState();
  const baseId = "new-resident";
  let id = baseId;
  let n = 1;
  while (s.residentsDraft.some((r) => r.id === id)) {
    n++;
    id = `${baseId}-${n}`;
  }
  updateResidents((rs) => {
    rs.push({
      id,
      name: "NEW RESIDENT",
      plate: "AA00 AAA",
      bio: "",
    });
  });
  setState({ selectedResidentIdx: getState().residentsDraft.length - 1 });
}

function onDeleteResident(idx: number): void {
  const r = getState().residentsDraft[idx];
  if (!r) return;
  if (!window.confirm(`Delete resident "${r.id}" (${r.name})? Any day JSON referencing this id will fail to load.`)) return;
  updateResidents((rs) => { rs.splice(idx, 1); });
  const s = getState();
  if (s.selectedResidentIdx >= s.residentsDraft.length) {
    setState({ selectedResidentIdx: Math.max(0, s.residentsDraft.length - 1) });
  }
}

// --- Small DOM helpers ---

function el(tag: string, attrs: Record<string, string> = {}, text?: string): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null && v !== "") e.setAttribute(k, v);
  }
  if (text != null) e.textContent = text;
  return e;
}

function labeled(text: string, control: HTMLElement): HTMLElement {
  const lab = el("label");
  lab.appendChild(el("span", {}, text));
  lab.appendChild(control);
  return lab;
}

function textInput(value: string, onChange: (v: string) => void, bad = false): HTMLInputElement {
  const i = el("input", { type: "text" }) as HTMLInputElement;
  i.value = value;
  if (bad) i.classList.add("bad");
  i.addEventListener("input", () => onChange(i.value));
  return i;
}

function selectInput(options: string[], value: string, onChange: (v: string) => void): HTMLSelectElement {
  const s = el("select") as HTMLSelectElement;
  for (const o of options) {
    const opt = el("option", { value: o }, o || "(none)") as HTMLOptionElement;
    if (o === value) opt.selected = true;
    s.appendChild(opt);
  }
  s.addEventListener("change", () => onChange(s.value));
  return s;
}

function checkboxInput(value: boolean, onChange: (v: boolean) => void): HTMLInputElement {
  const i = el("input", { type: "checkbox" }) as HTMLInputElement;
  i.checked = value;
  i.addEventListener("change", () => onChange(i.checked));
  return i;
}

function zoneLabel(z: ZoneCode): string {
  return z === null ? "null" : z;
}
function parseZone(s: string): ZoneCode {
  if (s === "A" || s === "B" || s === "C") return s;
  return null;
}
