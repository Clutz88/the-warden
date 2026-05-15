import "./editor.css";
import type { DayDefRaw } from "../game/types";
import day1Raw from "../game/days/day1.json";
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
  initState({
    day: 1,
    draft: structuredClone(day1Raw) as DayDefRaw,
    selectedCarIdx: 0,
    dirty: false,
    saveStatus: { kind: "idle" },
  });
  subscribe(() => render(root));
}
