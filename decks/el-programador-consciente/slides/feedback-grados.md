---
template: viz
recipe: canvas-quiet
label: 'Feedback 90º · 180º · 360º'
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <style>
      .s-viz .stage > .wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
      .s-viz .mk { display: inline-block; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; }
      .s-viz .center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; }
      .s-viz .big { font-family: var(--font-display); font-size: 84px; line-height: 1; letter-spacing: -0.01em; }
      .s-viz .mid { font-family: var(--font-display); font-size: 48px; line-height: 1.05; }
      .s-viz .small { font-family: var(--font-mono); font-size: 24px; letter-spacing: .1em; text-transform: uppercase; opacity: .85; }
      .s-viz .row { display: flex; gap: 90px; justify-content: center; align-items: flex-start; }
      .s-viz .cell { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      </style>
      <style>section.slide.s-viz{background:#4A9AA8 !important;color:#F4F1EA !important;}</style><div class="wrap" style="justify-content:center"><svg viewBox="0 0 1600 600" style="width:100%;height:100%"><g data-from="1"><g fill="none" stroke="#FBE463" stroke-width="6" stroke-dasharray="14 12"><path d="M150 300 A150 150 0 0 1 300 150"/></g><g fill="none" stroke="#F4F1EA" stroke-width="6" opacity=".7"><path d="M176 300 A124 124 0 0 1 300 176"/></g><text x="300" y="380" text-anchor="middle" fill="#F4F1EA" font-family="var(--font-display)" font-size="44">90º</text></g><g data-from="2"><g fill="none" stroke="#FBE463" stroke-width="6" stroke-dasharray="14 12"><path d="M650 300 A150 150 0 0 1 950 300"/></g><g fill="none" stroke="#F4F1EA" stroke-width="6" opacity=".7"><path d="M676 300 A124 124 0 0 1 924 300"/></g><text x="800" y="380" text-anchor="middle" fill="#F4F1EA" font-family="var(--font-display)" font-size="44">180º</text></g><g data-from="3"><g fill="none" stroke="#FBE463" stroke-width="6" stroke-dasharray="14 12"><circle cx="1300" cy="300" r="150"/></g><g fill="none" stroke="#F4F1EA" stroke-width="6" opacity=".7"><circle cx="1300" cy="300" r="124"/></g><text x="1300" y="316" text-anchor="middle" fill="#F4F1EA" font-family="var(--font-display)" font-size="44">360º</text></g></svg></div>
steps: 3
revealStart: 1
notes: |
  90º: con tu mánager.
  180º: con tus peers.
  360º: con todos; si sos mánager, también tus reporters.
  Este es el feedback formal, el que la empresa suele fomentar. Tenemos que conocerlo bien, entenderlo bien y tenerlo bien presente, porque si no lo hacemos...
---
