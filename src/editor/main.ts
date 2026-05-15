import "./editor.css";
import { RAW_DAYS } from "./rawDays";
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
  const persistedDay = Number(sessionStorage.getItem("editor:day"));
  const persistedCarIdx = Number(sessionStorage.getItem("editor:carIdx"));
  const initialDay = RAW_DAYS[persistedDay] ? persistedDay : 1;
  const raw = RAW_DAYS[initialDay]!;
  const initialCarIdx = Number.isFinite(persistedCarIdx) && persistedCarIdx >= 0 && persistedCarIdx < raw.cars.length
    ? persistedCarIdx
    : 0;

  initState({
    day: initialDay,
    draft: structuredClone(raw),
    selectedCarIdx: initialCarIdx,
    dirty: false,
    saveStatus: { kind: "idle" },
  });
  subscribe((s) => {
    sessionStorage.setItem("editor:day", String(s.day));
    sessionStorage.setItem("editor:carIdx", String(s.selectedCarIdx));
    render(root);
  });
}
