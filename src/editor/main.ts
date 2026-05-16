import "./editor.css";
import { RAW_DAYS } from "./rawDays";
import { RESIDENTS, type Resident } from "../game/residents";
import { STREETS } from "../game/streets";
import type { Street, TuningRaw } from "../game/types";
import tuningRaw from "../data/tuning.json";
import carsSprites from "../data/sprites/cars.json";
import iconsSprites from "../data/sprites/icons.json";
import docSprites from "../data/sprites/doc.json";
import paletteSprites from "../data/sprites/palette.json";
import type { SpritesDraft } from "./state";
import { initState, subscribe } from "./state";
import { render } from "./ui";

const root = document.getElementById("editor-root");
if (!root) throw new Error("editor-root missing");

if (!import.meta.env.DEV) {
  root.innerHTML = `
    <div class="prod-block">
      <h2 style="margin-top:0">Editor unavailable</h2>
      <p>The Warden day editor only runs in dev mode. Run <code>npm run dev</code> and open <code>/editor.html</code>.</p>
    </div>
  `;
} else {
  const rawMode = sessionStorage.getItem("editor:mode");
  const persistedMode =
    rawMode === "residents" ||
    rawMode === "streets" ||
    rawMode === "tuning" ||
    rawMode === "sprites"
      ? rawMode
      : "day";
  const persistedDay = Number(sessionStorage.getItem("editor:day"));
  const persistedCarIdx = Number(sessionStorage.getItem("editor:carIdx"));
  const persistedResidentIdx = Number(sessionStorage.getItem("editor:residentIdx"));
  const persistedStreetIdx = Number(sessionStorage.getItem("editor:streetIdx"));
  const initialDay = RAW_DAYS[persistedDay] ? persistedDay : 1;
  const raw = RAW_DAYS[initialDay]!;
  const initialCarIdx =
    Number.isFinite(persistedCarIdx) && persistedCarIdx >= 0 && persistedCarIdx < raw.cars.length
      ? persistedCarIdx
      : 0;
  const initialResidentIdx =
    Number.isFinite(persistedResidentIdx) &&
    persistedResidentIdx >= 0 &&
    persistedResidentIdx < RESIDENTS.length
      ? persistedResidentIdx
      : 0;
  const streetsList = Object.values(STREETS) as Street[];
  const initialStreetIdx =
    Number.isFinite(persistedStreetIdx) &&
    persistedStreetIdx >= 0 &&
    persistedStreetIdx < streetsList.length
      ? persistedStreetIdx
      : 0;

  initState({
    mode: persistedMode,
    day: initialDay,
    draft: structuredClone(raw),
    selectedCarIdx: initialCarIdx,
    dirty: false,
    residentsDraft: structuredClone(RESIDENTS) as Resident[],
    selectedResidentIdx: initialResidentIdx,
    residentsDirty: false,
    streetsDraft: structuredClone(streetsList),
    selectedStreetIdx: initialStreetIdx,
    streetsDirty: false,
    tuningDraft: structuredClone(tuningRaw) as TuningRaw,
    tuningDirty: false,
    spritesDraft: structuredClone({
      cars: carsSprites,
      icons: iconsSprites,
      doc: docSprites,
      palette: paletteSprites,
    }) as SpritesDraft,
    spritesSubMode:
      sessionStorage.getItem("editor:spritesSub") === "palette" ? "palette" : "sprite",
    spriteSelection: { category: "cars", key: Object.keys(carsSprites)[0]! },
    spriteBrush: "O",
    spritePreviewColour: "Red",
    spritesDirtyCats: { cars: false, icons: false, doc: false, palette: false },
    saveStatus: { kind: "idle" },
  });
  subscribe((s) => {
    sessionStorage.setItem("editor:mode", s.mode);
    sessionStorage.setItem("editor:day", String(s.day));
    sessionStorage.setItem("editor:carIdx", String(s.selectedCarIdx));
    sessionStorage.setItem("editor:residentIdx", String(s.selectedResidentIdx));
    sessionStorage.setItem("editor:streetIdx", String(s.selectedStreetIdx));
    sessionStorage.setItem("editor:spritesSub", s.spritesSubMode);
    render(root);
  });
}
