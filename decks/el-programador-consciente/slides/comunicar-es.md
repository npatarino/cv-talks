---
template: viz
recipe: canvas-quiet
label: 'Comunicar es'
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
      <style>section.slide.s-viz{background:#8B5FD0 !important;color:#F4F1EA !important;}</style><div class="wrap" style="position:relative"><div data-from="1" style="position:absolute;left:120px;top:60px;background:#FBE463;color:#1F2A33;font-family:var(--font-display);font-size:60px;padding:14px 40px">Informando.</div><div data-from="2" style="position:absolute;left:1040px;top:480px;background:#B9E04A;color:#1F2A33;font-family:var(--font-display);font-size:60px;padding:14px 40px">Interactuando.</div><div data-from="3" style="position:absolute;left:1120px;top:220px;background:#4A9AA8;color:#1F2A33;font-family:var(--font-display);font-size:60px;padding:14px 40px">Negociando.</div><div data-from="4" style="position:absolute;left:160px;top:720px;background:#3FB6A8;color:#1F2A33;font-family:var(--font-display);font-size:60px;padding:14px 40px">Conectando</div><div data-from="5" style="position:absolute;left:120px;top:400px;background:#E8485F;color:#1F2A33;font-family:var(--font-display);font-size:60px;padding:14px 40px">Mentoreando.</div></div>
steps: 5
revealStart: 0
---
