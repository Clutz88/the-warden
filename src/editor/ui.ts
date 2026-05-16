import type { CarSpecRaw, DocRaw, StreetKind, ToneCode, ZoneCode } from "../game/types";
import { STREETS } from "../game/streets";
import {
  getState,
  resizeGrid,
  setState,
  spritesAnyDirty,
  switchDay,
  switchMode,
  updateCar,
  updateDraft,
  updateGridCell,
  updateResident,
  updateResidents,
  updateSprites,
  updateStreet,
  updateStreets,
  updateTuning,
} from "./state";
import { DAY_NUMBERS, RAW_DAYS, emptyDayRaw, nextDayNumber } from "./rawDays";
import { previewDraft, type DraftPreview } from "./preview";
import { saveDay, saveResidents, saveSpriteCategory, saveStreets, saveTuning } from "./save";
import { findBrokenRefs, type IntegrityIssue } from "./integrity";
import { carPalette } from "../ui/sprites/palette";
import { spriteSvg } from "../ui/sprites/pixelArt";

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
const STREET_KINDS: StreetKind[] = [
  "pay-and-display",
  "permit",
  "double-yellow",
  "single-yellow",
  "loading-bay",
];

export function render(root: HTMLElement): void {
  const s = getState();
  if (s.mode === "residents") {
    root.replaceChildren(buildResidentsPage());
  } else if (s.mode === "streets") {
    root.replaceChildren(buildStreetsPage());
  } else if (s.mode === "tuning") {
    root.replaceChildren(buildTuningPage());
  } else if (s.mode === "sprites") {
    root.replaceChildren(buildSpritesPage());
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

function buildStreetsPage(): HTMLElement {
  const wrap = el("div", { id: "editor-root" });
  wrap.appendChild(buildHeader());
  const body = el("div", { class: "editor-body" });
  body.appendChild(buildStreetsLeft());
  body.appendChild(buildStreetsRight());
  wrap.appendChild(body);
  return wrap;
}

function buildTuningPage(): HTMLElement {
  const wrap = el("div", { id: "editor-root" });
  wrap.appendChild(buildHeader());
  const body = el("div", { class: "editor-body" });
  body.appendChild(buildTuningLeft());
  body.appendChild(buildTuningRight());
  wrap.appendChild(body);
  return wrap;
}

function buildHeader(): HTMLElement {
  const s = getState();
  const header = el("header", { class: "editor-header" });
  const headerTitle =
    s.mode === "residents"
      ? "THE WARDEN — RESIDENTS"
      : s.mode === "streets"
        ? "THE WARDEN — STREETS"
        : s.mode === "tuning"
          ? "THE WARDEN — TUNING"
          : s.mode === "sprites"
            ? "THE WARDEN — SPRITES"
            : "THE WARDEN — DAY EDITOR";
  header.appendChild(el("h1", {}, headerTitle));

  const modeToggle = el("div", { class: "mode-toggle" });
  const modes = [
    { key: "day", label: "Days" },
    { key: "residents", label: "Residents" },
    { key: "streets", label: "Streets" },
    { key: "tuning", label: "Tuning" },
    { key: "sprites", label: "Sprites" },
  ] as const;
  for (const m of modes) {
    const b = el("button", { class: s.mode === m.key ? "primary" : "" }, m.label);
    b.addEventListener("click", () => {
      if (m.key === s.mode) return;
      const currentDirty =
        s.mode === "day"
          ? s.dirty
          : s.mode === "residents"
            ? s.residentsDirty
            : s.mode === "streets"
              ? s.streetsDirty
              : s.mode === "tuning"
                ? s.tuningDirty
                : spritesAnyDirty(s);
      if (currentDirty && !window.confirm("Unsaved changes will be lost. Switch mode anyway?"))
        return;
      switchMode(m.key);
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

    header.appendChild(el("span", { class: "muted small" }, `${s.draft.cars.length} cars`));
  } else if (s.mode === "residents") {
    const newResidentBtn = el("button", { title: "Add a new resident" }, "+ New resident");
    newResidentBtn.addEventListener("click", onAddResident);
    header.appendChild(newResidentBtn);
    header.appendChild(
      el("span", { class: "muted small" }, `${s.residentsDraft.length} residents`),
    );
  } else if (s.mode === "streets") {
    const newStreetBtn = el("button", { title: "Add a new street" }, "+ New street");
    newStreetBtn.addEventListener("click", onAddStreet);
    header.appendChild(newStreetBtn);
    header.appendChild(el("span", { class: "muted small" }, `${s.streetsDraft.length} streets`));
  } else if (s.mode === "tuning") {
    header.appendChild(el("span", { class: "muted small" }, "Global game balance"));
  } else {
    // sprites mode
    const sub = el("div", { class: "mode-toggle" });
    for (const m of ["sprite", "palette"] as const) {
      const b = el(
        "button",
        { class: s.spritesSubMode === m ? "primary" : "" },
        m === "sprite" ? "Sprite" : "Palette",
      );
      b.addEventListener("click", () =>
        setState({ spritesSubMode: m, saveStatus: { kind: "idle" } }),
      );
      sub.appendChild(b);
    }
    header.appendChild(sub);
  }

  header.appendChild(el("div", { class: "spacer" }));

  const status = el(
    "span",
    {
      class: `status ${statusClass(s.saveStatus.kind)}`,
    },
    statusText(s.saveStatus),
  );
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
    const dirty =
      st.mode === "residents"
        ? st.residentsDirty
        : st.mode === "streets"
          ? st.streetsDirty
          : st.mode === "tuning"
            ? st.tuningDirty
            : st.mode === "sprites"
              ? spritesAnyDirty(st)
              : st.dirty;
    return dirty ? "● unsaved changes" : "saved";
  }
  if (s.kind === "saving") return "saving…";
  if (s.kind === "ok") return `saved ${s.message ?? ""}`;
  return `error: ${s.message ?? ""}`;
}

function checkIntegrityOrConfirm(): boolean {
  const s = getState();
  // Only relevant when a save would affect cross-references: day saves, residents, streets.
  if (s.mode !== "day" && s.mode !== "residents" && s.mode !== "streets") return true;
  const issues = findBrokenRefs(s, DAY_NUMBERS, (n) => RAW_DAYS[n]);
  if (issues.length === 0) return true;
  const list = issues
    .slice(0, 20)
    .map((i) => `• ${i.scope}: ${i.message}`)
    .join("\n");
  const more = issues.length > 20 ? `\n• … and ${issues.length - 20} more` : "";
  return window.confirm(
    `Saving will leave ${issues.length} broken reference${issues.length === 1 ? "" : "s"}.\n` +
      `Day files referencing the missing id will fail to load and the game won't start.\n\n` +
      `${list}${more}\n\nSave anyway?`,
  );
}

async function onSave(): Promise<void> {
  if (!checkIntegrityOrConfirm()) return;
  const s = getState();
  setState({ saveStatus: { kind: "saving" } });
  if (s.mode === "residents") {
    const res = await saveResidents(s.residentsDraft);
    if (res.ok) {
      setState({ residentsDirty: false, saveStatus: { kind: "ok", message: res.file } });
    } else {
      setState({ saveStatus: { kind: "err", message: res.error } });
    }
  } else if (s.mode === "streets") {
    const res = await saveStreets(s.streetsDraft);
    if (res.ok) {
      setState({ streetsDirty: false, saveStatus: { kind: "ok", message: res.file } });
    } else {
      setState({ saveStatus: { kind: "err", message: res.error } });
    }
  } else if (s.mode === "tuning") {
    const res = await saveTuning(s.tuningDraft);
    if (res.ok) {
      setState({ tuningDirty: false, saveStatus: { kind: "ok", message: res.file } });
    } else {
      setState({ saveStatus: { kind: "err", message: res.error } });
    }
  } else if (s.mode === "sprites") {
    const cats: ("cars" | "icons" | "doc" | "palette")[] = ["cars", "icons", "doc", "palette"];
    const dirty = cats.filter((c) => s.spritesDirtyCats[c]);
    if (dirty.length === 0) {
      setState({ saveStatus: { kind: "ok", message: "nothing to save" } });
      return;
    }
    const written: string[] = [];
    for (const c of dirty) {
      const res = await saveSpriteCategory(c, s.spritesDraft[c]);
      if (!res.ok) {
        setState({ saveStatus: { kind: "err", message: `${c}: ${res.error}` } });
        return;
      }
      written.push(res.file);
    }
    setState({
      spritesDirtyCats: { cars: false, icons: false, doc: false, palette: false },
      saveStatus: { kind: "ok", message: written.join(", ") },
    });
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
  if (s.dirty && !window.confirm("Unsaved changes will be lost. Continue creating a new day?"))
    return;
  const day = nextDayNumber();
  if (
    !window.confirm(`Create Day ${day}? An empty day${day}.json will be written to src/game/days/.`)
  )
    return;
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
  col.appendChild(buildDayIntegrityPanel());
  return col;
}

function buildDayIntegrityPanel(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "References"));
  // Only check this day's broken refs against the current drafts.
  const issues: IntegrityIssue[] = findBrokenRefs(s, [s.day], (n) =>
    n === s.day ? s.draft : RAW_DAYS[n],
  );
  if (issues.length === 0) {
    card.appendChild(el("div", { class: "banner ok" }, "All car refs resolve"));
  } else {
    for (const i of issues) {
      card.appendChild(el("div", { class: "banner err" }, i.message));
    }
  }
  return card;
}

// --- Day metadata ---

function buildDayMeta(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Day Settings"));

  const briefing = el("textarea", { rows: "3" }) as HTMLTextAreaElement;
  briefing.value = s.draft.briefing;
  briefing.addEventListener("input", () =>
    updateDraft((d) => {
      d.briefing = briefing.value;
    }),
  );
  card.appendChild(labeled("Briefing", briefing));

  card.appendChild(el("h3", {}, "Rule summary (one per line)"));
  const rules = el("textarea", { rows: "4" }) as HTMLTextAreaElement;
  rules.value = s.draft.newRuleSummary.join("\n");
  rules.addEventListener("input", () =>
    updateDraft((d) => {
      d.newRuleSummary = rules.value
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
    }),
  );
  card.appendChild(rules);

  const rent = el("input", { type: "number", min: "0" }) as HTMLInputElement;
  rent.value = String(s.draft.rent);
  rent.addEventListener("input", () =>
    updateDraft((d) => {
      d.rent = Number(rent.value) || 0;
    }),
  );
  const rentWrap = el("div", { style: "max-width: 160px" });
  rentWrap.appendChild(labeled("Rent (£)", rent));
  card.appendChild(rentWrap);

  card.appendChild(el("h3", {}, "Streets on patrol"));
  const list = el("div", { class: "checkbox-list" });
  for (const key of STREET_KEYS) {
    const lab = el("label");
    const cb = el("input", { type: "checkbox" }) as HTMLInputElement;
    cb.checked = s.draft.streets.includes(key);
    cb.addEventListener("change", () =>
      updateDraft((d) => {
        const set = new Set(d.streets);
        if (cb.checked) set.add(key);
        else set.delete(key);
        d.streets = STREET_KEYS.filter((k) => set.has(k));
      }),
    );
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
  ["#", "Seen", "Plate", "Street", "Docs", "Truth", ""].forEach((h) =>
    trH.appendChild(el("th", {}, h)),
  );
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
  updateDraft((d) => {
    d.cars.push(newCar);
  });
  setState({ selectedCarIdx: getState().draft.cars.length - 1 });
}

function onDeleteCar(idx: number): void {
  if (!confirm(`Delete car ${idx + 1}?`)) return;
  updateDraft((d) => {
    d.cars.splice(idx, 1);
  });
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
  grid.appendChild(
    labeled(
      "Seen at (HH:MM)",
      textInput(
        car.seenAt,
        (v) =>
          updateCar(idx, (c) => {
            c.seenAt = v;
          }),
        !/^\d\d:\d\d$/.test(car.seenAt),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Plate",
      textInput(car.plate, (v) =>
        updateCar(idx, (c) => {
          c.plate = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Colour",
      textInput(car.colour, (v) =>
        updateCar(idx, (c) => {
          c.colour = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Model",
      textInput(car.model, (v) =>
        updateCar(idx, (c) => {
          c.model = v;
        }),
      ),
    ),
  );
  card.appendChild(grid);

  const grid2 = el("div", { class: "grid-2" });
  grid2.appendChild(
    labeled(
      "Street",
      selectInput(STREET_KEYS, car.street, (v) =>
        updateCar(idx, (c) => {
          c.street = v;
        }),
      ),
    ),
  );
  const residentOpts = ["", ...getState().residentsDraft.map((r) => r.id)];
  grid2.appendChild(
    labeled(
      "Resident (optional)",
      selectInput(residentOpts, car.residentId ?? "", (v) =>
        updateCar(idx, (c) => {
          if (v) c.residentId = v;
          else delete c.residentId;
        }),
      ),
    ),
  );
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
    updateCar(idx, (c) => {
      c.docs.push(defaultDoc(typeSel.value as DocRaw["type"], c));
    });
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
    updateCar(carIdx, (c) => {
      c.docs.splice(docIdx, 1);
    });
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
      g.appendChild(
        labeled(
          "Zone",
          selectInput(ZONES.map(zoneLabel), zoneLabel(doc.zone), (v) =>
            replace({ zone: parseZone(v) }),
          ),
        ),
      );
      g.appendChild(
        labeled(
          "Expires at (HH:MM)",
          textInput(
            doc.expiresAt,
            (v) => replace({ expiresAt: v }),
            !/^\d\d:\d\d$/.test(doc.expiresAt),
          ),
        ),
      );
      return g;
    }
    case "permit": {
      const g = el("div", { class: "grid-3" });
      g.appendChild(
        labeled(
          "Zone",
          selectInput(ZONES.map(zoneLabel), zoneLabel(doc.zone), (v) =>
            replace({ zone: parseZone(v) }),
          ),
        ),
      );
      g.appendChild(
        labeled(
          "Plate on permit",
          textInput(doc.plate, (v) => replace({ plate: v })),
        ),
      );
      g.appendChild(
        labeled(
          "Valid until (DD/MM/YYYY)",
          textInput(doc.validUntil, (v) => replace({ validUntil: v })),
        ),
      );
      return g;
    }
    case "blue-badge": {
      const g = el("div", { class: "grid-4" });
      g.appendChild(
        labeled(
          "Holder",
          textInput(doc.holder, (v) => replace({ holder: v })),
        ),
      );
      g.appendChild(
        labeled(
          "Valid until",
          textInput(doc.validUntil, (v) => replace({ validUntil: v })),
        ),
      );
      g.appendChild(
        labeled(
          "Clock shown",
          checkboxInput(doc.clockShown, (v) => replace({ clockShown: v })),
        ),
      );
      g.appendChild(
        labeled(
          "Clock set at (HH:MM, blank for none)",
          textInput(doc.clockSetAt ?? "", (v) => replace({ clockSetAt: v ? v : null })),
        ),
      );
      return g;
    }
    case "loading-slip": {
      const g = el("div", { class: "grid-2" });
      g.appendChild(
        labeled(
          "Firm",
          textInput(doc.firm, (v) => replace({ firm: v })),
        ),
      );
      g.appendChild(
        labeled(
          "Arrived at (HH:MM)",
          textInput(
            doc.arrivedAt,
            (v) => replace({ arrivedAt: v }),
            !/^\d\d:\d\d$/.test(doc.arrivedAt),
          ),
        ),
      );
      return g;
    }
    case "note": {
      const g = el("div", { class: "grid-2" });
      g.appendChild(
        labeled(
          "From",
          textInput(doc.from, (v) => replace({ from: v })),
        ),
      );
      const ta = el("textarea", { rows: "2" }) as HTMLTextAreaElement;
      ta.value = doc.text;
      ta.addEventListener("input", () => replace({ text: ta.value }));
      g.appendChild(labeled("Text", ta));
      return g;
    }
    case "reactive-note": {
      const wrap = el("div");
      wrap.appendChild(
        labeled(
          "From",
          textInput(doc.from, (v) => replace({ from: v })),
        ),
      );
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
      return {
        type: "blue-badge",
        holder: "HOLDER NAME",
        validUntil: "30/06/2027",
        clockShown: true,
        clockSetAt: car.seenAt,
      };
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
  grid.appendChild(
    labeled(
      "ID (referenced from day JSON)",
      textInput(r.id, (v) =>
        updateResident(idx, (x) => {
          x.id = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Name",
      textInput(r.name, (v) =>
        updateResident(idx, (x) => {
          x.name = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Plate",
      textInput(r.plate, (v) =>
        updateResident(idx, (x) => {
          x.plate = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Home street (free text, optional)",
      textInput(r.homeStreetId ?? "", (v) =>
        updateResident(idx, (x) => {
          if (v) x.homeStreetId = v;
          else delete x.homeStreetId;
        }),
      ),
    ),
  );
  card.appendChild(grid);

  const bioTa = el("textarea", { rows: "3" }) as HTMLTextAreaElement;
  bioTa.value = r.bio;
  bioTa.addEventListener("input", () =>
    updateResident(idx, (x) => {
      x.bio = bioTa.value;
    }),
  );
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

  // Cross-day reference check: every car.residentId across all days must
  // resolve in the current residents draft.
  for (const dayNum of Object.keys(RAW_DAYS).map(Number)) {
    const raw = RAW_DAYS[dayNum];
    if (!raw) continue;
    for (const c of raw.cars) {
      if (c.residentId && !ids.has(c.residentId)) {
        errors.push(`Day ${dayNum} car ${c.plate} references missing resident "${c.residentId}"`);
      }
    }
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
  if (
    !window.confirm(
      `Delete resident "${r.id}" (${r.name})? Any day JSON referencing this id will fail to load.`,
    )
  )
    return;
  updateResidents((rs) => {
    rs.splice(idx, 1);
  });
  const s = getState();
  if (s.selectedResidentIdx >= s.residentsDraft.length) {
    setState({ selectedResidentIdx: Math.max(0, s.residentsDraft.length - 1) });
  }
}

// --- Streets mode ---

function buildStreetsLeft(): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildStreetsList());
  const s = getState();
  const idx = s.selectedStreetIdx;
  if (idx >= 0 && idx < s.streetsDraft.length) {
    col.appendChild(buildStreetDetail(idx));
  }
  return col;
}

function buildStreetsRight(): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildStreetsValidation());
  return col;
}

function buildStreetsList(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  const head = el("div", { class: "row", style: "justify-content: space-between" });
  head.appendChild(el("h2", { style: "margin: 0" }, `Streets (${s.streetsDraft.length})`));
  const addBtn = el("button", {}, "+ Add street");
  addBtn.addEventListener("click", onAddStreet);
  head.appendChild(addBtn);
  card.appendChild(head);

  const table = el("table", { class: "cars" });
  const thead = el("thead");
  const trH = el("tr");
  ["#", "ID", "Name", "Kind", "Zone", ""].forEach((h) => trH.appendChild(el("th", {}, h)));
  thead.appendChild(trH);
  table.appendChild(thead);

  const tbody = el("tbody");
  s.streetsDraft.forEach((street, i) => {
    const tr = el("tr", { class: i === s.selectedStreetIdx ? "selected" : "" });
    tr.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) return;
      setState({ selectedStreetIdx: i });
    });
    tr.appendChild(el("td", {}, String(i + 1)));
    tr.appendChild(el("td", {}, street.id));
    tr.appendChild(el("td", {}, street.name));
    tr.appendChild(el("td", {}, street.kind));
    tr.appendChild(el("td", {}, street.zone ?? "—"));
    const actions = el("td");
    const del = el("button", { class: "danger" }, "✕");
    del.addEventListener("click", () => onDeleteStreet(i));
    actions.appendChild(del);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  return card;
}

function buildStreetDetail(idx: number): HTMLElement {
  const street = getState().streetsDraft[idx]!;
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, `Street ${idx + 1} — ${street.name}`));

  const grid = el("div", { class: "grid-2" });
  grid.appendChild(
    labeled(
      "ID (referenced from day JSON)",
      textInput(street.id, (v) =>
        updateStreet(idx, (x) => {
          x.id = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Display name",
      textInput(street.name, (v) =>
        updateStreet(idx, (x) => {
          x.name = v;
        }),
      ),
    ),
  );
  card.appendChild(grid);

  const grid2 = el("div", { class: "grid-2" });
  grid2.appendChild(
    labeled(
      "Kind",
      selectInput(STREET_KINDS as string[], street.kind, (v) =>
        updateStreet(idx, (x) => {
          x.kind = v as StreetKind;
        }),
      ),
    ),
  );
  grid2.appendChild(
    labeled(
      "Zone",
      selectInput(ZONES.map(zoneLabel), zoneLabel(street.zone), (v) =>
        updateStreet(idx, (x) => {
          x.zone = parseZone(v);
        }),
      ),
    ),
  );
  card.appendChild(grid2);

  return card;
}

function buildStreetsValidation(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Validation"));

  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  for (const street of s.streetsDraft) {
    if (!street.id.trim()) errors.push(`Street "${street.name || "(unnamed)"}" has empty id`);
    else if (ids.has(street.id)) errors.push(`Duplicate id: ${street.id}`);
    ids.add(street.id);
    if (!street.name.trim()) errors.push(`Street "${street.id}" has empty name`);
    if (street.kind === "permit" && street.zone === null) {
      warnings.push(`Permit street "${street.id}" has no zone — permit-zone-match will fail`);
    }
    if (street.kind !== "permit" && street.zone !== null) {
      warnings.push(`Non-permit street "${street.id}" has a zone — engine ignores it`);
    }
  }

  // Cross-check day references
  for (const dayNum of Object.keys(RAW_DAYS).map(Number)) {
    const raw = RAW_DAYS[dayNum];
    if (!raw) continue;
    for (const sid of raw.streets) {
      if (!ids.has(sid)) errors.push(`Day ${dayNum} streets[] references missing street "${sid}"`);
    }
    for (const c of raw.cars) {
      if (!ids.has(c.street))
        errors.push(`Day ${dayNum} car ${c.plate} references missing street "${c.street}"`);
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    card.appendChild(el("div", { class: "banner ok" }, "All streets valid"));
  }
  for (const e of errors) card.appendChild(el("div", { class: "banner err" }, e));
  for (const w of warnings) card.appendChild(el("div", { class: "banner" }, `⚠ ${w}`));
  return card;
}

function onAddStreet(): void {
  const s = getState();
  const baseId = "newStreet";
  let id = baseId;
  let n = 1;
  while (s.streetsDraft.some((x) => x.id === id)) {
    n++;
    id = `${baseId}${n}`;
  }
  updateStreets((xs) => {
    xs.push({ id, name: "New Street", kind: "pay-and-display", zone: null });
  });
  setState({ selectedStreetIdx: getState().streetsDraft.length - 1 });
}

function onDeleteStreet(idx: number): void {
  const street = getState().streetsDraft[idx];
  if (!street) return;
  // Find day references
  const refs: string[] = [];
  for (const dayNum of Object.keys(RAW_DAYS).map(Number)) {
    const raw = RAW_DAYS[dayNum];
    if (!raw) continue;
    if (raw.streets.includes(street.id)) refs.push(`Day ${dayNum} streets`);
    for (const c of raw.cars) {
      if (c.street === street.id) refs.push(`Day ${dayNum} car ${c.plate}`);
    }
  }
  let msg = `Delete street "${street.id}" (${street.name})?`;
  if (refs.length) {
    msg += `\n\nWARNING: still referenced by ${refs.length} entr${refs.length === 1 ? "y" : "ies"}:\n - ${refs.slice(0, 6).join("\n - ")}`;
    if (refs.length > 6) msg += `\n - … and ${refs.length - 6} more`;
    msg += "\n\nDay files will fail to load until you fix them.";
  }
  if (!window.confirm(msg)) return;
  updateStreets((xs) => {
    xs.splice(idx, 1);
  });
  const s = getState();
  if (s.selectedStreetIdx >= s.streetsDraft.length) {
    setState({ selectedStreetIdx: Math.max(0, s.streetsDraft.length - 1) });
  }
}

// --- Tuning mode ---

function buildTuningLeft(): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildTuningForm());
  return col;
}

function buildTuningRight(): HTMLElement {
  const col = el("div", { class: "column" });
  col.appendChild(buildTuningPreview());
  return col;
}

function buildTuningForm(): HTMLElement {
  const t = getState().tuningDraft;
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Game tuning"));

  card.appendChild(el("h3", {}, "Shift"));
  const shiftBox = el("div", { style: "max-width: 200px" });
  shiftBox.appendChild(
    labeled(
      "Shift start (HH:MM)",
      textInput(
        t.shiftStart,
        (v) =>
          updateTuning((x) => {
            x.shiftStart = v;
          }),
        !/^\d\d:\d\d$/.test(t.shiftStart),
      ),
    ),
  );
  card.appendChild(shiftBox);

  card.appendChild(el("h3", {}, "Wages"));
  const grid = el("div", { class: "grid-3" });
  grid.appendChild(
    labeled(
      "Correct decision (£)",
      numberInput(t.wages.correct, (v) =>
        updateTuning((x) => {
          x.wages.correct = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Wrong decision (£)",
      numberInput(t.wages.wrong, (v) =>
        updateTuning((x) => {
          x.wages.wrong = v;
        }),
      ),
    ),
  );
  grid.appendChild(
    labeled(
      "Flawless-shift bonus (£)",
      numberInput(t.wages.flawlessBonus, (v) =>
        updateTuning((x) => {
          x.wages.flawlessBonus = v;
        }),
      ),
    ),
  );
  card.appendChild(grid);

  return card;
}

function buildTuningPreview(): HTMLElement {
  const s = getState();
  const t = s.tuningDraft;
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Effect preview"));

  const formatClock = /^\d\d:\d\d$/.test(t.shiftStart);
  if (!formatClock) {
    card.appendChild(
      el("div", { class: "banner err" }, `Shift start "${t.shiftStart}" is not HH:MM`),
    );
    return card;
  }
  card.appendChild(el("div", { class: "banner ok" }, "Tuning valid"));

  // Show shift earnings projection for each authored day.
  const list = el("div", { class: "truth-list" });
  const sortedDays = Object.keys(RAW_DAYS)
    .map(Number)
    .sort((a, b) => a - b);
  for (const dayNum of sortedDays) {
    const day = RAW_DAYS[dayNum];
    if (!day) continue;
    const carCount = day.cars.length;
    const flawless = carCount * t.wages.correct + t.wages.flawlessBonus;
    const allWrong = carCount * t.wages.wrong;
    const row = el("div", { class: "truth-row" });
    row.appendChild(el("span", { class: "when" }, `Day ${dayNum}`));
    row.appendChild(el("span", { class: "plate" }, `${carCount}c`));
    row.appendChild(el("span", { class: "muted" }, `rent £${day.rent}`));
    const verdict = el(
      "span",
      { class: flawless >= day.rent ? "codes pass" : "codes pcn" },
      `flawless £${flawless} · all wrong £${allWrong}`,
    );
    row.appendChild(verdict);
    list.appendChild(row);
  }
  card.appendChild(list);
  return card;
}

// --- Sprites mode ---

function buildSpritesPage(): HTMLElement {
  const wrap = el("div", { id: "editor-root" });
  wrap.appendChild(buildHeader());
  const body = el("div", { class: "editor-body" });
  const s = getState();
  if (s.spritesSubMode === "palette") {
    body.appendChild(buildPaletteEditor());
    body.appendChild(buildPaletteLegendCol());
  } else {
    body.appendChild(buildSpriteEditorLeft());
    body.appendChild(buildSpriteEditorRight());
  }
  wrap.appendChild(body);
  return wrap;
}

function buildSpriteEditorLeft(): HTMLElement {
  const s = getState();
  const col = el("div", { class: "column" });

  // Sprite picker
  const pickerCard = el("div", { class: "card" });
  pickerCard.appendChild(el("h2", {}, "Sprite"));
  const pickerSel = el("select") as HTMLSelectElement;
  const addGroup = (category: "cars" | "icons" | "doc", label: string) => {
    const og = document.createElement("optgroup");
    og.label = label;
    for (const key of Object.keys(s.spritesDraft[category])) {
      const opt = document.createElement("option");
      opt.value = `${category}::${key}`;
      opt.textContent = key;
      if (s.spriteSelection.category === category && s.spriteSelection.key === key)
        opt.selected = true;
      og.appendChild(opt);
    }
    pickerSel.appendChild(og);
  };
  addGroup("cars", "Cars");
  addGroup("icons", "Icons");
  addGroup("doc", "Doc decorations");
  pickerSel.addEventListener("change", () => {
    const [category, key] = pickerSel.value.split("::") as ["cars" | "icons" | "doc", string];
    setState({ spriteSelection: { category, key } });
  });
  pickerCard.appendChild(pickerSel);

  // Resize controls + dimensions
  const sel = s.spriteSelection;
  const grid = s.spritesDraft[sel.category][sel.key] ?? "";
  const rows = grid.split("\n");
  const dims = `${rows[0]?.length ?? 0} × ${rows.length}`;
  const dimRow = el("div", { class: "row small muted", style: "margin-top: 8px; gap: 12px" });
  dimRow.appendChild(el("span", {}, `Size: ${dims}`));
  for (const [label, dw, dh] of [
    ["+col", 1, 0],
    ["−col", -1, 0],
    ["+row", 0, 1],
    ["−row", 0, -1],
  ] as const) {
    const b = el("button", { class: "small" }, label);
    b.addEventListener("click", () => resizeGrid(sel.category, sel.key, dw, dh));
    dimRow.appendChild(b);
  }
  pickerCard.appendChild(dimRow);
  col.appendChild(pickerCard);

  // Canvas
  col.appendChild(buildSpriteCanvas(grid));

  // Brush palette
  col.appendChild(buildBrushPalette());

  return col;
}

function buildSpriteCanvas(grid: string): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Canvas"));
  const help = el(
    "div",
    { class: "muted small", style: "margin-bottom: 8px" },
    "Left-click to paint with the active brush. Right-click to erase to '.'.",
  );
  card.appendChild(help);

  const palette =
    s.spriteSelection.category === "cars"
      ? carPalette(s.spritesDraft.palette.carColours[s.spritePreviewColour] ?? "#888")
      : s.spritesDraft.palette.base;

  const rows = grid.split("\n");
  const wrap = el("div", { class: "sprite-canvas" });
  rows.forEach((row, y) => {
    const rowEl = el("div", { class: "sprite-row" });
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!;
      const cell = el("div", { class: "sprite-cell" });
      cell.dataset.ch = ch;
      cell.style.background = ch === "." ? "transparent" : (palette[ch] ?? "#444");
      cell.title = `(${x},${y}) ${ch}`;
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        updateGridCell(s.spriteSelection.category, s.spriteSelection.key, x, y, ".");
      });
      cell.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const ch2 = (e as MouseEvent).button === 2 ? "." : getState().spriteBrush;
        updateGridCell(s.spriteSelection.category, s.spriteSelection.key, x, y, ch2);
      });
      cell.addEventListener("mouseenter", (e) => {
        if ((e as MouseEvent).buttons === 1) {
          updateGridCell(
            s.spriteSelection.category,
            s.spriteSelection.key,
            x,
            y,
            getState().spriteBrush,
          );
        } else if ((e as MouseEvent).buttons === 2) {
          updateGridCell(s.spriteSelection.category, s.spriteSelection.key, x, y, ".");
        }
      });
      rowEl.appendChild(cell);
    }
    wrap.appendChild(rowEl);
  });
  card.appendChild(wrap);
  return card;
}

function buildBrushPalette(): HTMLElement {
  const s = getState();
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Brush"));
  const subRow = el("div", { class: "row small muted", style: "margin-bottom: 8px; gap: 12px" });
  subRow.appendChild(
    el("span", {}, `Active: ${s.spriteBrush === "." ? "(erase)" : s.spriteBrush}`),
  );
  if (s.spriteSelection.category === "cars") {
    const sel = el("select", { style: "width: auto" }) as HTMLSelectElement;
    for (const c of Object.keys(s.spritesDraft.palette.carColours)) {
      const opt = el("option", { value: c }, c) as HTMLOptionElement;
      if (c === s.spritePreviewColour) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", () => setState({ spritePreviewColour: sel.value }));
    const lab = el("label", { class: "row", style: "gap: 6px" });
    lab.appendChild(el("span", { class: "small muted" }, "Preview colour:"));
    lab.appendChild(sel);
    subRow.appendChild(lab);
  }
  card.appendChild(subRow);

  const grid = el("div", { class: "swatch-grid" });
  // Erase swatch
  grid.appendChild(buildSwatch(".", "transparent", "."));
  if (s.spriteSelection.category === "cars") {
    // Show body-shade swatches (B, D, d use the preview colour)
    const bodyHex = s.spritesDraft.palette.carColours[s.spritePreviewColour] ?? "#888";
    const carPal = carPalette(bodyHex);
    grid.appendChild(buildSwatch("B", carPal.B!, "B (body)"));
    grid.appendChild(buildSwatch("D", carPal.D!, "D (shade 1)"));
    grid.appendChild(buildSwatch("d", carPal.d!, "d (shade 2)"));
  }
  for (const [ch, hex] of Object.entries(s.spritesDraft.palette.base)) {
    grid.appendChild(buildSwatch(ch, hex, `${ch} (${hex})`));
  }
  card.appendChild(grid);
  return card;
}

function buildSwatch(ch: string, hex: string, title: string): HTMLElement {
  const s = getState();
  const sw = el("button", {
    class: `swatch ${s.spriteBrush === ch ? "active" : ""}`,
    title,
  });
  sw.style.background = hex;
  sw.textContent = ch;
  sw.addEventListener("click", () => setState({ spriteBrush: ch }));
  return sw;
}

function buildSpriteEditorRight(): HTMLElement {
  const s = getState();
  const col = el("div", { class: "column" });
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Live preview"));

  const sel = s.spriteSelection;
  const grid = s.spritesDraft[sel.category][sel.key] ?? "";

  let svg = "";
  try {
    if (sel.category === "cars") {
      const bodyHex = s.spritesDraft.palette.carColours[s.spritePreviewColour] ?? "#888";
      svg = spriteSvg(grid, carPalette(bodyHex), { className: "spr-preview" });
    } else {
      svg = spriteSvg(grid, s.spritesDraft.palette.base, { className: "spr-preview" });
    }
  } catch (err) {
    card.appendChild(el("div", { class: "banner err" }, String(err)));
  }
  const wrap = el("div", { class: "sprite-preview-wrap" });
  wrap.innerHTML = svg;
  card.appendChild(wrap);

  const note = el(
    "div",
    { class: "muted small", style: "margin-top: 10px" },
    sel.category === "cars"
      ? `Previewing ${sel.key} in ${s.spritePreviewColour}. Save writes src/data/sprites/cars.json.`
      : `Previewing ${sel.key}. Save writes src/data/sprites/${sel.category}.json.`,
  );
  card.appendChild(note);
  col.appendChild(card);
  return col;
}

// --- Palette editor ---

function buildPaletteEditor(): HTMLElement {
  const s = getState();
  const col = el("div", { class: "column" });

  const baseCard = el("div", { class: "card" });
  baseCard.appendChild(el("h2", {}, "Base palette"));
  baseCard.appendChild(
    el(
      "div",
      { class: "muted small", style: "margin-bottom: 8px" },
      "Each character maps to a hex colour. Used by all non-body pixels in every sprite.",
    ),
  );
  const baseGrid = el("div", { class: "palette-edit-grid" });
  for (const [ch, hex] of Object.entries(s.spritesDraft.palette.base)) {
    baseGrid.appendChild(buildPaletteEditRow(ch, hex, "base"));
  }
  baseCard.appendChild(baseGrid);

  const addBaseRow = el("div", { class: "row", style: "margin-top: 12px; gap: 6px" });
  const newCh = el("input", {
    type: "text",
    placeholder: "char",
    style: "width: 60px",
  }) as HTMLInputElement;
  const newHex = el("input", {
    type: "text",
    placeholder: "#RRGGBB",
    style: "width: 120px",
  }) as HTMLInputElement;
  const addBtn = el("button", {}, "+ Add char");
  addBtn.addEventListener("click", () => {
    const c = newCh.value.trim();
    const h = newHex.value.trim();
    if (c.length !== 1) {
      alert("Character must be exactly 1");
      return;
    }
    if (!/^#[0-9a-f]{6}$/i.test(h)) {
      alert("Hex must be #RRGGBB");
      return;
    }
    if (s.spritesDraft.palette.base[c]) {
      alert(`Char "${c}" already exists`);
      return;
    }
    updateSprites("palette", (p) => {
      (p as typeof s.spritesDraft.palette).base[c] = h;
    });
  });
  addBaseRow.appendChild(newCh);
  addBaseRow.appendChild(newHex);
  addBaseRow.appendChild(addBtn);
  baseCard.appendChild(addBaseRow);
  col.appendChild(baseCard);

  const carCard = el("div", { class: "card" });
  carCard.appendChild(el("h2", {}, "Car body colours"));
  carCard.appendChild(
    el(
      "div",
      { class: "muted small", style: "margin-bottom: 8px" },
      "Each car colour name maps to a hex. Used as the B body fill (with D and d as auto-darkened shades).",
    ),
  );
  const carGrid = el("div", { class: "palette-edit-grid" });
  for (const [name, hex] of Object.entries(s.spritesDraft.palette.carColours)) {
    carGrid.appendChild(buildPaletteEditRow(name, hex, "carColours"));
  }
  carCard.appendChild(carGrid);
  col.appendChild(carCard);

  return col;
}

function buildPaletteEditRow(
  key: string,
  hex: string,
  section: "base" | "carColours",
): HTMLElement {
  const row = el("div", { class: "palette-edit-row" });
  const swatch = el("span", { class: "swatch-mini", title: hex });
  swatch.style.background = hex;
  row.appendChild(swatch);
  row.appendChild(el("span", { class: "swatch-key" }, key));
  const inp = el("input", { type: "text", style: "width: 110px" }) as HTMLInputElement;
  inp.value = hex;
  inp.addEventListener("input", () => {
    const v = inp.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) {
      inp.classList.remove("bad");
      updateSprites("palette", (p) => {
        const pal = p as { base: Record<string, string>; carColours: Record<string, string> };
        if (section === "base") pal.base[key] = v;
        else pal.carColours[key] = v;
      });
    } else {
      inp.classList.add("bad");
    }
  });
  row.appendChild(inp);
  const del = el("button", { class: "danger small", title: `Delete ${key}` }, "✕");
  del.addEventListener("click", () => {
    if (!window.confirm(`Delete ${section === "base" ? "char" : "colour"} "${key}"?`)) return;
    updateSprites("palette", (p) => {
      const pal = p as { base: Record<string, string>; carColours: Record<string, string> };
      if (section === "base") delete pal.base[key];
      else delete pal.carColours[key];
    });
  });
  row.appendChild(del);
  return row;
}

function buildPaletteLegendCol(): HTMLElement {
  const s = getState();
  const col = el("div", { class: "column" });
  const card = el("div", { class: "card" });
  card.appendChild(el("h2", {}, "Where these are used"));
  const tally: Record<string, number> = {};
  for (const category of ["cars", "icons", "doc"] as const) {
    for (const grid of Object.values(s.spritesDraft[category])) {
      for (const ch of grid) {
        if (ch === "\n" || ch === ".") continue;
        tally[ch] = (tally[ch] ?? 0) + 1;
      }
    }
  }
  const list = el("div", { class: "swatch-grid" });
  const chars = Object.keys(s.spritesDraft.palette.base).sort();
  for (const ch of chars) {
    const count = tally[ch] ?? 0;
    const sw = el("div", { class: "swatch readonly", title: `${ch}: ${count} pixels` });
    sw.style.background = s.spritesDraft.palette.base[ch] ?? "#444";
    sw.textContent = ch;
    const badge = el("span", { class: "swatch-count" }, String(count));
    sw.appendChild(badge);
    list.appendChild(sw);
  }
  card.appendChild(list);

  const orphans = chars.filter((c) => (tally[c] ?? 0) === 0);
  if (orphans.length) {
    card.appendChild(
      el(
        "div",
        { class: "banner", style: "margin-top: 12px" },
        `⚠ Unused base chars: ${orphans.join(" ")}`,
      ),
    );
  } else {
    card.appendChild(
      el(
        "div",
        { class: "banner ok", style: "margin-top: 12px" },
        "All base chars used by at least one sprite",
      ),
    );
  }
  col.appendChild(card);
  return col;
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

function numberInput(value: number, onChange: (v: number) => void): HTMLInputElement {
  const i = el("input", { type: "number" }) as HTMLInputElement;
  i.value = String(value);
  i.addEventListener("input", () => {
    const n = Number(i.value);
    if (Number.isFinite(n)) onChange(n);
  });
  return i;
}

function selectInput(
  options: string[],
  value: string,
  onChange: (v: string) => void,
): HTMLSelectElement {
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
