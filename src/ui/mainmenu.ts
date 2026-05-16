export function renderMainMenu(hasSave: boolean, hasStats: boolean): string {
  const continueBtn = hasSave
    ? `<button class="btn" data-action="continue">CONTINUE</button>`
    : `<button class="btn" disabled title="No saved shift yet">CONTINUE</button>`;
  const statsBtn = hasStats
    ? `<button class="btn" data-action="show-stats">CAREER STATS</button>`
    : `<button class="btn" disabled title="No career stats yet">CAREER STATS</button>`;
  return `
    <div class="mainmenu-page">
      <div class="mainmenu-art" aria-hidden="true"></div>
      <div class="mainmenu-panel">
        <h1>THE WARDEN</h1>
        <p class="subtitle">Borough of Ashbridge — Parking Enforcement</p>
        <div class="mainmenu-buttons">
          ${continueBtn}
          <button class="btn" data-action="start-new">NEW SHIFT</button>
          ${statsBtn}
          <button class="btn" data-action="show-help">CONTROLS &amp; HELP</button>
        </div>
        <p class="mainmenu-footer">Press <span class="kbd">Enter</span> to begin.</p>
      </div>
    </div>
  `;
}
