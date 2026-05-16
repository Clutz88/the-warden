import type { GameState } from "../game/types";
import { isMuted } from "../audio/music";

export function renderHud(s: GameState): string {
  const hh = String(Math.floor(s.clock / 60)).padStart(2, "0");
  const mm = String(s.clock % 60).padStart(2, "0");
  const total = s.cars.length;
  const seen = Math.min(s.carIndex, total);
  const muted = isMuted();
  return `
    <div class="hud">
      <span class="title">THE WARDEN</span>
      <span class="stat">DAY <b>${s.day}</b></span>
      <span class="stat">CLOCK <b class="clock">${hh}:${mm}</b></span>
      <span class="stat">CAR <b>${seen + (s.phase === "shift" || s.phase === "mistake" ? 1 : 0)}/${total}</b></span>
      <span class="stat">WAGES <b>£${s.wages}</b></span>
      <span class="stat">MISTAKES <b>${s.mistakes}</b></span>
      <button class="hud-btn" data-action="show-help" title="Help (?)" aria-label="Show keyboard help">?</button>
      <button class="hud-btn" data-action="toggle-mute" title="Mute music (M)" aria-label="${muted ? "Unmute" : "Mute"} music">${muted ? "🔇" : "🔊"}</button>
    </div>
  `;
}
