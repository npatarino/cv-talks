---
template: viz
recipe: energy-loud
label: Push → Pull
variant: default
fields:
  title: { content: '<span style="color:#E24A6E">Push</span> → <span style="color:#3B6FE0">Pull</span>', meta: Title_Text }
  stage:
    meta: Stage_HTML
    content: |
      <style>
      .s-viz .pp { flex: 1; display: grid; grid-template-columns: 220px 1fr 180px 1fr 180px 1fr; gap: 0; padding: 40px 60px 0 0; align-items: start; }
      .s-viz .pp .col { background: var(--recipe-surface); border: 3px solid var(--recipe-ink); border-radius: 18px; padding: 22px 20px; display: flex; flex-direction: column; gap: 14px; min-height: 480px; }
      .s-viz .pp .col h3 { font-family: var(--font-display); font-size: 34px; margin: 0 0 8px; }
      .s-viz .pp .card { height: 54px; border-radius: 10px; background: var(--recipe-ink); opacity: .16; }
      .s-viz .pp .arrow { font-family: var(--font-display); font-size: 36px; display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 150px; }
      .s-viz .pp .arrow svg { width: 150px; height: 62px; overflow: visible; }
      .s-viz .pp .push { color: #E24A6E; }
      .s-viz .pp .pull { color: #3B6FE0; }
      </style>
      <div class="pp">
        <div class="arrow push" data-from="1"><svg viewBox="0 0 220 90"><path d="M10 45 H190" stroke="currentColor" stroke-width="14" stroke-linecap="round"/><path d="M160 15 L200 45 L160 75" stroke="currentColor" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 15 L130 75 M130 15 L70 75" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg>Push</div>
        <div class="col"><h3>🗒️ Backlog</h3><div class="card"></div><div class="card"></div><div class="card"></div><div class="card"></div><div class="card"></div><div class="card"></div></div>
        <div class="arrow pull" data-from="2"><svg viewBox="0 0 220 90"><path d="M10 45 H190" stroke="currentColor" stroke-width="14" stroke-linecap="round"/><path d="M160 15 L200 45 L160 75" stroke="currentColor" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Pull</div>
        <div class="col"><h3>⏳ In progress</h3><div class="card"></div><div class="card"></div><div class="card"></div></div>
        <div></div>
        <div class="col"><h3>✅ Done</h3><div class="card"></div><div class="card"></div></div>
      </div>
steps: 2
revealStart: 0
notes: |
  No esperes a que te empujen la tarea (push): andá al tablero y tomala vos (pull).
---
